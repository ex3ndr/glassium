import { fromMulaw } from "./mulaw";
import { createOpusCodec } from "./opus";

export type AudioCodec = {
    start(): void;
    stop(): void;
    decode(src: Uint8Array): Int16Array;
}

export function createCodec(type: 'pcm' | 'mulaw' | 'opus'): AudioCodec {
    if (type === 'opus') {
        return createOpusCodec();
    }
    return {
        start: () => {

        },
        stop: () => {

        },
        decode: (src: Uint8Array): Int16Array => {
            if (type === 'pcm') {
                return new Int16Array(src.buffer);
            } else if (type === 'mulaw') {
                let res = new Int16Array(src.length);
                for (let i = 0; i < src.length; i++) {
                    res[i] = fromMulaw(src[i]);
                }
                return res;
            } else {
                throw new Error('Unknown codec: ' + type);
            }
        }
    }
}

export function createSkipCodec(codec: AudioCodec, skip: number): AudioCodec {
    let skipCounter = skip;
    return {
        start: () => {
            codec.start();
            skipCounter = skip;
        },
        stop: () => {
            codec.stop();
        },
        decode: (src: Uint8Array): Int16Array => {

            // Convert to PCM
            let output = codec.decode(src);
            if (skipCounter <= 0) {
                return output;
            }

            // If we need to discard all
            if (output.length < skipCounter) {
                skipCounter -= output.length;
                return new Int16Array(0);
            }

            // If we need reached the end
            let res = output.slice(skipCounter);
            skipCounter = 0;
            return res;
        }
    }
}