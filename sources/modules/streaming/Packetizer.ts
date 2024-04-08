import { AsyncLock } from "teslabot";
import { prepareAudio } from "./prepareAudio";
import { compress } from "../../../modules/audio";

export class Packetizer {
    readonly format: 'opus' | 'pcm-16' | 'pcm-8' | 'mulaw-16' | 'mulaw-8';
    readonly batchSize: number;
    readonly callback: (format: string, frame: Uint8Array) => void;
    private _batch: Uint8Array[] = [];
    private _batchLock = new AsyncLock();


    constructor(
        format: 'opus' | 'pcm-16' | 'pcm-8' | 'mulaw-16' | 'mulaw-8',
        batchSize: number,
        callback: (format: string, frame: Uint8Array) => void
    ) {
        this.format = format;
        this.batchSize = batchSize;
        this.callback = callback;
    }

    async append(frame: Uint8Array) {
        this._batchLock.inLock(async () => {

            // Append batch
            this._batch.push(frame.subarray(3));

            // Convert if batch is full
            if (this._batch.length >= this.batchSize) {
                await this.#doFlush();
            }
        });
    }

    async flush() {
        this._batchLock.inLock(async () => {
            if (this._batch.length > 0) {
                await this.#doFlush();
            }
        });
    }

    async #doFlush() {
        let prepared = prepareAudio(this.format, this._batch);
        this._batch = [];
        if (prepared.format === 'wav') {
            let compressed = await compress(prepared.data);
            console.log('Compressed from ' + prepared.data.length + ' to ' + compressed.data.length);
            prepared = compressed;
        }
        console.log('preapred', prepared.format, prepared.data.length);
        this.callback(prepared.format, prepared.data);
    }
}