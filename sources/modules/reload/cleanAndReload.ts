import * as Update from 'expo-updates';
import { storage } from "../../storage";

export async function cleanAndReload() {

    // Clear all storage
    storage.clearAll();

    // Reload the app
    if (!__DEV__) {
        await Update.reloadAsync();
    } else {
        throw Error('Please, reload app manually.');
    }
}