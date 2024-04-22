import { isDevMode } from "../devmode";

let logs: string[] = [];

export function log(tag: string, src: string) {
    if (__DEV__) {
        console.log('[' + tag + ']: ' + src);
    }
    if (isDevMode()) {
        logs.push('[' + tag + ']: ' + src);
        if (logs.length > 1000) {
            logs = logs.slice(logs.length - 1000);
        }
    }
}

export function useLogs() {
    return logs;
}