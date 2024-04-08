import { atom, useAtomValue } from 'jotai';
import { SuperClient } from "../api/client";
import { storage } from '../../storage';
import { InvalidateSync } from 'teslabot';
import { Jotai } from './Jotai';

export type ViewSession = {
    id: string,
    index: number,
    state: 'starting' | 'processing' | 'finished' | 'canceled' | 'in-progress',
    audio: {
        duration: number,
        size: number
    } | null
};

export class SessionsModel {
    readonly client: SuperClient;
    readonly sessions = atom<ViewSession[] | null>(null);
    readonly jotai: Jotai;
    #sessions: ViewSession[] | null = null;
    #refresh: InvalidateSync

    constructor(client: SuperClient, jotai: Jotai) {
        this.client = client;
        this.jotai = jotai;

        // Load initial
        let ex = storage.getString('sessions');
        if (ex) {
            this.#sessions = JSON.parse(ex);
            this.jotai.set(this.sessions, this.#filter(this.#sessions!));
        }

        // Refresh
        this.#refresh = new InvalidateSync(async () => {
            let loaded = await this.client.listSessions();
            this.#applySessions(loaded.sessions.map((v) => ({ id: v.id, index: v.index, state: v.state, audio: v.audio })));
        });
    }

    #applySessions = (sessions: ViewSession[]) => {

        // Collect updated IDs
        let updated = new Set<string>();
        for (let session of sessions) {
            updated.add(session.id);
        }

        // Merge
        let merged = [...sessions, ...(this.#sessions || [])!.filter(s => !updated.has(s.id))];
        merged.sort((a, b) => b.index - a.index);

        // Update
        this.#sessions = merged;
        storage.set('sessions', JSON.stringify(this.#sessions));
        this.jotai.set(this.sessions, this.#filter(this.#sessions!));
    }

    #filter = (sessions: ViewSession[]) => {
        return sessions.filter(s => s.state !== 'canceled');
    }

    apply = (session: ViewSession) => {
        this.#applySessions([session]);
    }

    applyPartial = (session: Partial<ViewSession>) => {
        let s = this.#sessions?.find(s => s.id === session.id);
        if (!s) {
            return;
        }
        this.apply({ ...s, ...session });
    }

    invalidate = () => {
        this.#refresh.invalidate();
    }

    use = () => {
        return useAtomValue(this.sessions);
    }
}