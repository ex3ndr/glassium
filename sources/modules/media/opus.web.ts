import { OpusDecoder } from 'opus-decoder';
import type { AudioCodec } from "./audioCodec";

export function createOpusCodec(): AudioCodec {
    let decoder: OpusDecoder | null = null;
    let decoderReady = false;
    return {
        start: () => {
            const dec = new OpusDecoder();
            decoder = dec;
            decoderReady = false;
            decoder.ready.then(() => {
                if (decoder === dec) {
                    decoderReady = true;
                }
            });
        },
        stop: () => {
            decoder?.free();
            decoder = null;
        },
        decode: (src: Uint8Array): Int16Array => {
            if (decoder && decoderReady) {
                let frames = decoder.decodeFrame(src).channelData[0];
                let res = new Int16Array(frames.length);
                for (let i = 0; i < frames.length; i++) {
                    res[i] = frames[i] * 32767;
                }
                return res;
            } else {
                return new Int16Array(0);
            }
        }
    }
}