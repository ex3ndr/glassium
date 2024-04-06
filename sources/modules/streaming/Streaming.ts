import { AsyncLock } from "teslabot";
import { SuperClient } from "../api/client";

export class Streaming {
    readonly client: SuperClient;
    readonly session: string;
    readonly format: 'opus' | 'pcm-16' | 'pcm-8' | 'mulaw-16' | 'mulaw-8';
    readonly batchSize: number;
    private _batch: Uint8Array[] = [];
    private _batchLock = new AsyncLock();

    constructor(
        client: SuperClient,
        session: string,
        format: 'opus' | 'pcm-16' | 'pcm-8' | 'mulaw-16' | 'mulaw-8',
        batchSize: number
    ) {
        this.client = client;
        this.session = session;
        this.format = format;
        this.batchSize = batchSize;
    }

    async append(frame: Uint8Array) {
        this._batchLock.inLock(async () => {
            this._batch.push(frame);
            if (this._batch.length >= this.batchSize) {
                // await this.flush();
            }
        });
    }
}