import { WaveFile } from "wavefile";

export function framesToWav(sr: number, frames: Int16Array[]) {

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
    for (let f of frames) {
        buffer.set(f, offset);
        offset += f.length;
    }

    // Create wav
    let wav = new WaveFile();
    wav.fromScratch(1, sr, '16', buffer);
    return wav.toBuffer();
}