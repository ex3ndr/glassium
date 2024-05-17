import * as React from 'react';
import { InvalidateSync } from './sync';

export function useCached<T>(invoke: () => Promise<T>) {
    const [data, setData] = React.useState<T | null>(null);
    const sync = React.useMemo(() => {
        let sync = new InvalidateSync(async () => {
            let data = await invoke();
            setData(data);
        })
        sync.invalidate();
        return sync;
    }, []);

    return [data, sync] as const;
}