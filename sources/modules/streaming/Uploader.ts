import { AsyncLock } from "teslabot";
import { SuperClient } from "../api/client";
import { fromByteArray } from 'react-native-quick-base64'

export class Uploader {
    client: SuperClient;
    session: string;
    lock = new AsyncLock();
    private _index = 0;

    constructor(client: SuperClient, session: string) {
        this.client = client;
        this.session = session;
    }

    upload(format: string, data: Uint8Array) {
        this.lock.inLock(async () => {
            let repeatKey = 'upload-' + (this._index++);
            let base64 = fromByteArray(data);
            let output = await this.client.uploadAudio(this.session, repeatKey, format, [base64]);
            console.log('Uploaded', output);
        });
    }

    async awaitCompletion() {
        await this.lock.inLock(async () => {
            // Do nothing
        });
    }
}