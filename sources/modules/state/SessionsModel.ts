import { atom, createStore, useAtomValue } from 'jotai';
import { SuperClient } from "../api/client";
import { storage } from '../../storage';
import { InvalidateSync } from 'teslabot';

export type ViewSession = {
    id: string,
    index: number,
    state: 'starting' | 'processing' | 'finished' | 'canceled' | 'in-progress',
};

export class SessionsModel {
    readonly client: SuperClient;
    readonly sessions = atom<ViewSession[] | null>(null);
    readonly store: ReturnType<typeof createStore>;
    #sessions: ViewSession[] | null = null;
    #refresh: InvalidateSync

    constructor(client: SuperClient, store: ReturnType<typeof createStore>) {
        this.client = client;
        this.store = store;

        // Load initial
        let ex = storage.getString('sessions');
        if (ex) {
            this.#sessions = JSON.parse(ex);
            this.store.set(this.sessions, this.#filter(this.#sessions!));
        }

        // Refresh
        this.#refresh = new InvalidateSync(async () => {
            let loaded = await this.client.listSessions();
            this.#applySessions(loaded.sessions.map((v) => ({ id: v.id, index: v.index, state: v.state })));
        });
    }

    #applySessions = (sessions: ViewSession[]) => {

        // Check if changed
        let changed = false;
        let updated = new Set<string>();
        for (let session of sessions) {
            let ex = this.#sessions?.find(s => s.id === session.id);
            if (!ex || ex.state !== session.state) {
                changed = true;
            }
            updated.add(session.id);
        }
        if (!changed) {
            return; // Nothing to do
        }

        // Merge
        let merged = [...sessions, ...(this.#sessions || [])!.filter(s => !updated.has(s.id))];
        merged.sort((a, b) => b.index - a.index);

        // Update
        this.#sessions = merged;
        storage.set('sessions', JSON.stringify(this.#sessions));
        this.store.set(this.sessions, this.#filter(this.#sessions!));
    }

    #filter = (sessions: ViewSession[]) => {
        return sessions.filter(s => s.state !== 'canceled');
    }

    invalidate = () => {
        this.#refresh.invalidate();
    }

    use = () => {
        return useAtomValue(this.sessions);
    }
}