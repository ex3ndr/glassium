import { Axios } from "axios";
import { backoff } from "../../utils/time";
import { Schema } from "./client.schema";

export class SuperClient {
    readonly client: Axios
    constructor(client: Axios) {
        this.client = client;
    }

    fetchPreState() {
        return backoff(async () => {
            let res = await this.client.get('/pre/state');
            return Schema.preState.parse(res.data);
        })
    }

    preUsername(username: string) {
        return backoff(async () => {
            let res = await this.client.post('/pre/username', { username });
            return Schema.preUsername.parse(res.data);
        })
    }

    preName(firstName: string, lastName: string | null) {
        return backoff(async () => {
            let res = await this.client.post('/pre/name', { firstName, lastName });
            return Schema.preName.parse(res.data);
        })
    }

    preComplete() {
        return backoff(async () => {
            await this.client.post('/pre/complete');
        })
    }

    startSession(repeatKey: string) {
        return backoff(async () => {
            let res = await this.client.post('/app/session/start', { repeatKey, timeout: 15 }); // 15 seconds timeout
            return Schema.sessionStart.parse(res.data).session;
        })
    }

    async stopSession(session: string) {
        await this.client.post('/app/session/stop', { session });
    }

    uploadAudio(session: string, repeatKey: string, format: string, chunks: string[]) {
        return backoff(async () => {
            let res = await this.client.post('/app/session/upload/audio', { session, repeatKey, format, chunks });
            return Schema.uploadAudio.parse(res.data);
        })
    }
}