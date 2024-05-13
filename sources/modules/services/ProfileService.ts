import * as z from 'zod';
import { BubbleClient } from "../api/client";
import { Jotai } from "./_types";
import { storageGetTyped, storageSetTyped } from '../../storage';
import { atom, useAtomValue } from 'jotai';
import { AppState } from 'react-native';
import { posthogIdentity } from '../track/track';
import { InvalidateSync } from '../../utils/sync';
import { backoff } from '../../utils/time';
import { readFileAsync } from '../fs/fs';

const ProfileSchema = z.object({
    version: z.literal(2),
    body: z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string().nullable(),
        username: z.string(),
        phone: z.string().nullable(),
        voiceSample: z.boolean(),
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
            storageSetTyped('user-profile', ProfileSchema, { version: 2, body: loaded } satisfies ProfileStorage);
        });
        this.#sync.invalidate();

        // Refresh on app visible
        AppState.addEventListener('change', () => {
            if (AppState.currentState === 'active') {
                this.#sync.invalidate();
            }
        });
    }

    uploadVoiceSample = async (uri: string) => {
        let sample = await readFileAsync(uri, 'base64');
        await backoff(() => this.client.uploadVoiceSample(sample));
        await this.#sync.invalidateAndAwait();
    }

    use = () => {
        return useAtomValue(this.profile);
    }
}