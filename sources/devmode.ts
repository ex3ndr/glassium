import { storage } from "@/storage";

let lastDevMode = storage.getBoolean('dev-mode-enabled');

export function isDevMode(): boolean {
    if (__DEV__) {
        return true;
    }
    if (lastDevMode !== undefined) {
        return lastDevMode;
    }
    return false;
}

export function setDevMode(enabled: boolean) {
    lastDevMode = enabled;
    storage.set('dev-mode-enabled', enabled);
}