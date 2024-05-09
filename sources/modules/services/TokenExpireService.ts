import { BubbleClient } from "../api/client";
import { cleanAndReload } from "../reload/cleanAndReload";
import { AppState } from "react-native";
import { log } from "../../utils/logs";
import { InvalidateSync } from "../../utils/sync";

export class TokenExpireService {
    readonly client: BubbleClient;
    #sync: InvalidateSync;

    constructor(client: BubbleClient) {
        this.client = client;
        this.#sync = new InvalidateSync(async () => {
            if (!await this.client.tokenAndAccountStatus()) {
                log('EXP', 'Token expired. Reloading...');
                await cleanAndReload();
            }
        });
        this.#sync.invalidate();
        AppState.addEventListener('change', () => {
            this.#sync.invalidate();
        });
    }
}