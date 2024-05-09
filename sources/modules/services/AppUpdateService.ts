import { AppState } from "react-native";
import * as Update from 'expo-updates';
import { InvalidateSync } from "../../utils/sync";

export class AppUpdateService {

    #sync: InvalidateSync;

    constructor() {
        this.#sync = new InvalidateSync(this.#doCheck);
        if (!__DEV__) {
            AppState.addEventListener('change', (state) => {
                if (state === 'active') {
                    this.#sync.invalidate();
                }
            });
        }
    }

    #doCheck = async () => {
        await Update.checkForUpdateAsync();
    }
}