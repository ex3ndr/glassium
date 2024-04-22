import { createBackoff } from 'teslabot';
import { log } from './logs';
export async function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

export const backoff = createBackoff({
    onError(e, failuresCount) {
        log('ERR', 'Error: ' + e + ', failures: ' + failuresCount);
    },
});