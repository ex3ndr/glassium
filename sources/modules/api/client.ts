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

    // preAllocateUsername(username: string) {
    //     return backoff(async () => {
    //         let res = await this.client.post('/pre/username', { username });
    //         return Schema.preState.parse(res.data);
    //     })
    // }
}