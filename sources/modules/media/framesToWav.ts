import { WaveFile } from "wavefile";
import { delay } from "../../utils/time";

export async function framesToWav(sr: number, frames: Int16Array[]) {

    // Case for 1 frame
    if (frames.length === 1) {
        let wav = new WaveFile();
        wav.fromScratch(1, sr, '16', frames[0]);
        return wav.toBuffer();
    }

    // Concatenate frames
    let total = 0;
    for (let f of frames) {
        total += f.length;
    }
    let buffer = new Int16Array(total);
    let offset = 0;
    let count = 0;
    for (let f of frames) {
        buffer.set(f, offset);
        offset += f.length;
        count++;
        if (count % 1000 === 0) {
            await delay(1); // Don't block the main thread
        }
    }

    // Create wav
    let wav = new WaveFile();
    wav.fromScratch(1, sr, '16', buffer);
    return wav.toBuffer();
}