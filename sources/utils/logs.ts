import * as React from 'react';
import { isDevMode } from "@/devmode";

let logs: string[] = [];
let subscriptions: ((logs: string[]) => void)[] = [];
let handler: (line: string) => void = () => { };

export function log(tag: string, src: string) {
    // Print in debug
    if (__DEV__) {
        console.log('[' + tag + ']: ' + src);
    }

    // Store in logs if enabled
    if (isDevMode()) {
        logs.push('[' + tag + ']: ' + src);
        if (logs.length > 1000) {
            logs = logs.slice(logs.length - 1000);
        }
        subscriptions.forEach(s => s(logs));
    }

    // Store in handler
    handler('[' + tag + ']: ' + src);
}

export function setLogHandler(h: (line: string) => void) {
    handler = h;
}

export function useLogs() {
    let [res, set] = React.useState(logs);
    React.useEffect(() => {
        let sub = (logs: string[]) => set([...logs]);
        subscriptions.push(sub);
        return () => {
            subscriptions = subscriptions.filter(s => s !== sub);
        };
    }, []);
    return res;
}