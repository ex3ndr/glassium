import { Asset } from 'expo-asset';
import { log } from '@/utils/logs';
import { InferenceSession, Tensor, createSession } from '@/modules/ai/onnx/onnx';
import { Platform } from 'react-native';

export class VADModel {
    static async create() {
        let session: InferenceSession;

        if (Platform.OS === 'web') {
            try {
                // Resolve local path
                log('VAD', 'Loading VAD model');
                let loaded = (await Asset.loadAsync(require('./model.onnx')))[0];

                // Create inference session
                session = await createSession(loaded.uri);
            } catch (e) {
                console.warn(e);
                log('VAD', 'Failed to load VAD model: ' + (e as any).message);
                throw new Error('Failed to load VAD model');
            }
        } else {
            try {
                // Resolve local path
                log('VAD', 'Loading VAD model');
                let loaded = (await Asset.loadAsync(require('./model.onnx')))[0];
                let path = Platform.OS === 'ios' ? loaded.localUri!.replace('%20', ' ').replace('file://', '') : loaded.localUri!; // Hack to fix path

                // Create inference session
                session = await createSession(path);
            } catch (e) {
                console.warn(e);
                log('VAD', 'Failed to load VAD model: ' + (e as any).message);
                throw new Error('Failed to load VAD model');
            }
        }

        log('VAD', 'Model loaded');
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