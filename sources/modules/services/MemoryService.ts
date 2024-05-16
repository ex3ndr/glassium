import { run } from "@/utils/run";
import { AsyncLock } from "../../utils/lock";
import { backoff } from "../../utils/time";
import { BackendClient } from "../api/client";
import * as React from 'react';

export type MemoryViewItem = {
    id: string;
    index: number,
    createdAt: number,
    title: string;
    summary: string;
    image: {
        url: string;
        thumbhash: string;
        width: number;
        height: number;
    } | null;
}

export class MemoryService {
    readonly client: BackendClient;
    #lock = new AsyncLock();
    #memories = new Map<string, MemoryViewItem>();

    constructor(client: BackendClient) {
        this.client = client;
    }

    async assumeMemories(ids: string[]) {
        return await this.#lock.inLock(async () => {

            // Find missing
            let s = new Set(ids);
            let missing = ids.filter((id) => !this.#memories.has(id));
            if (missing.length === 0) {
                return;
            }

            // Load
            console.log('MemoryService.assumeMemories', missing);
            let res = await backoff(() => this.client.memories(Array.from(missing)));
            for (let i of res) {
                let item: MemoryViewItem = {
                    id: i.id,
                    index: i.index,
                    createdAt: i.createdAt,
                    title: i.title,
                    summary: i.summary,
                    image: i.image && i.imageMetadata ? {
                        url: i.image,
                        thumbhash: i.imageMetadata.thumbhash,
                        width: i.imageMetadata.width,
                        height: i.imageMetadata.height
                    } : null
                };
                this.#memories.set(i.id, item);
            }
        });
    }

    use(id: string) {
        let [state, setState] = React.useState(this.#memories.get(id));
        React.useEffect(() => {
            if (!state) {
                let exited = false;
                run(async () => {
                    await this.assumeMemories([id]);
                    if (!exited) {
                        setState(this.#memories.get(id));
                    }
                });
                return () => { exited = true; };
            }
        }, []);
        return state;
    }

    get(id: string) {
        return this.#memories.get(id)!;
    }
}