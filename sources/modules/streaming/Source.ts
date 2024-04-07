import { BTCharacteristic } from "../wearable/bt_common";

export type Source = {
    format: 'opus' | 'pcm-16' | 'pcm-8' | 'mulaw-16' | 'mulaw-8'
    start: (callback: (frame: Uint8Array) => void) => void
}

export class BTSource implements Source {
    characteristic: BTCharacteristic;
    format: 'pcm-16' | 'pcm-8' | 'mulaw-16' | 'mulaw-8';
    constructor(characteristic: BTCharacteristic, format: 'pcm-16' | 'pcm-8' | 'mulaw-16' | 'mulaw-8') {
        this.format = format;
        this.characteristic = characteristic;
    }
    start(callback: (frame: Uint8Array) => void) {
        return this.characteristic.subscribe((data) => {
            callback(data);
        });
    }
}