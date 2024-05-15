import { AsyncLock } from "../../utils/lock";
import { backoff } from "../../utils/time";
import { BackendClient } from "../api/client";

export type UserViewItem = {
    id: string,
    firstName: string,
    lastName: string | null,
    username: string,
    bot: boolean,
    system: boolean,
}

export class UserService {
    readonly client: BackendClient;
    #lock = new AsyncLock();
    #profiles = new Map<string, UserViewItem>();

    constructor(client: BackendClient) {
        this.client = client;
    }

    async assumeUsers(ids: string[]) {
        return await this.#lock.inLock(async () => {
            // Find missing
            let s = new Set(ids);
            let missing = ids.filter((id) => !this.#profiles.has(id));
            if (missing.length === 0) {
                return;
            }

            // Load
            let res = await backoff(() => this.client.users(Array.from(missing)));
            for (let i of res) {
                this.#profiles.set(i.id, i);
            }
        });
    }

    use(id: string) {
        return this.#profiles.get(id)!;
    }
}