import * as z from 'zod';
import { BubbleClient } from "../api/client";
import { Jotai } from "./_types";
import { storageGetTyped, storageSetTyped } from '../../storage';
import { atom, useAtomValue } from 'jotai';
import { InvalidateSync } from 'teslabot';
import { AppState } from 'react-native';
import { posthogIdentity } from '../track/track';
import { backoff } from '../../utils/time';

const ProfileSchema = z.object({
    version: z.literal(1),
    body: z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string().nullable(),
        username: z.string(),
        phone: z.string().nullable(),
    })
});

type ProfileStorage = z.infer<typeof ProfileSchema>;
export type Profile = ProfileStorage['body'];

export class ProfileService {
    readonly client: BubbleClient;
    readonly jotai: Jotai;
    readonly profile = atom<Profile | null>(null);
    #existing: Profile | null = null;
    #sync: InvalidateSync;

    constructor(client: BubbleClient, jotai: Jotai) {
        this.client = client;
        this.jotai = jotai;

        // Load existing
        let existing = storageGetTyped('user-profile', ProfileSchema);
        if (existing) {
            this.#existing = existing.body;
            this.jotai.set(this.profile, existing.body);
            posthogIdentity(existing.body.id)
        }

        // Run sync
        this.#sync = new InvalidateSync(async () => {
            let loaded = await this.client.me();

            // Update profile
            this.#existing = loaded;
            this.jotai.set(this.profile, loaded);
            posthogIdentity(loaded.id)
            storageSetTyped('user-profile', ProfileSchema, { version: 1, body: loaded } satisfies ProfileStorage);
        }, { backoff });
        this.#sync.invalidate();

        // Refresh on app visible
        AppState.addEventListener('change', () => {
            if (AppState.currentState === 'active') {
                this.#sync.invalidate();
            }
        });
    }

    use = () => {
        return useAtomValue(this.profile);
    }
}