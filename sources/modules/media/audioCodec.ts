import { opusDecode, opusStart, opusStop } from "../../../modules/audio"
import { fromMulaw } from "./mulaw";

export type AudioCodec = {
    start(): void;
    stop(): void;
    decode(src: Uint8Array): Int16Array;
}

export function createCodec(type: 'pcm' | 'mulaw' | 'opus') {
    return {
        start: () => {
            if (type === 'opus') {
                opusStart();
            }
        },
        stop: () => {
            if (type === 'opus') {
                opusStop();
            }
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
                return opusDecode(src);
            }
        }
    }
}