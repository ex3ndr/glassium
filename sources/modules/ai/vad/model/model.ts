import { Asset } from 'expo-asset';
import { log } from '../../../../utils/logs';
import { Tensor, InferenceSession } from 'isomorphic-onnxruntime';
import * as fs from 'expo-file-system';
import * as crypto from 'expo-crypto';

export class VADModel {
    static async create() {

        // Resolve local path
        let loaded = (await Asset.loadAsync(require('./model.onnx')))[0];
        let path = loaded.localUri!.replace('%20', ' ').replace('file://', ''); // Hack to fix path
        log('VAD', 'Model URI: ' + path);
        let info = await fs.getInfoAsync(path);
        log('VAD', 'Model Exists:' + info.exists);
        let model64 = await fs.readAsStringAsync(path, { encoding: 'base64' });
        let model = Buffer.from(model64, 'base64');
        log('VAD', 'Model hash: ' + await crypto.digestStringAsync(crypto.CryptoDigestAlgorithm.SHA256, model64, { encoding: crypto.CryptoEncoding.BASE64 }));

        // Create inference session
        const session: InferenceSession = await InferenceSession.create(model);
        return new VADModel(session);
    }

    #session: InferenceSession;
    #state: { sr: Tensor, h: Tensor, c: Tensor } | null = null;

    constructor(session: InferenceSession) {
        this.#session = session;
    }

    start = (sr: 16000 | 8000) => {
        const zeroes = Array(2 * 64).fill(0)
        this.#state = {
            sr: new Tensor('int64', [sr]),
            h: new Tensor("float32", zeroes, [2, 1, 64]),
            c: new Tensor("float32", zeroes, [2, 1, 64])
        };
    }

    process = async (audioFrame: Float32Array) => {
        if (!this.#state) {
            throw new Error('Model not started');
        }

        // Prepare inputs
        const t = new Tensor('float32', audioFrame, [1, audioFrame.length]);
        const inputs = {
            input: t,
            h: this.#state.h,
            c: this.#state.c,
            sr: this.#state.sr,
        };

        // Inference
        const output = await this.#session.run(inputs);

        // Update state
        this.#state.h = output.hn;
        this.#state.c = output.cn;

        // Return result
        return output.output.data[0] as number;
    }

    stop = () => {
        this.#state = null;
    }
}