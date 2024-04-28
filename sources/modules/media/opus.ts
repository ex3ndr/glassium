import { opusDecode, opusStart, opusStop } from "../../../modules/audio"
import type { AudioCodec } from "./audioCodec";

export function createOpusCodec(): AudioCodec {
    return {
        start: () => {
            opusStart();
        },
        stop: () => {
            opusStop();
        },
        decode: (src: Uint8Array): Int16Array => {
            return opusDecode(src);
        }
    }
}