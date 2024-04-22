import { Asset } from 'expo-asset';
import { InferenceSession, Tensor } from "onnxruntime-react-native";
import { log } from '../../../../utils/logs';

export class VADModel {
    static async create() {

        // Resolve local path
        let modelPath: string;
        let loaded = (await Asset.loadAsync(require('./model.onnx')))[0];
        if (loaded.localUri) {
            modelPath = loaded.localUri.substring('file://'.length);
        } else {
            let localUri = (await loaded.downloadAsync()).localUri!;
            modelPath = localUri.substring('file://'.length);
        }
        log('VAD', 'Model path: ' + modelPath);

        // Create inference session
        const session: InferenceSession = await InferenceSession.create(modelPath);
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