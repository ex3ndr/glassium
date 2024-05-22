import * as z from 'zod';
import { BackendClient } from "../api/client";
import { Jotai } from "./_types";
import { storage, storageGetTyped, storageSetTyped } from '../../storage';
import { atom, useAtomValue } from 'jotai';
import { AppState } from 'react-native';
import { posthogIdentity } from '../track/track';
import { InvalidateSync } from '../../utils/sync';
import { backoff } from '@/utils/time';
import { log } from '@/utils/logs';

const ProfileSchema = z.object({
    version: z.literal(3),
    body: z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string().nullable(),
        username: z.string(),
        phone: z.string().nullable(),
        voiceSample: z.boolean(),
        roles: z.array(z.string())
    })
});

type ProfileStorage = z.infer<typeof ProfileSchema>;
export type Profile = ProfileStorage['body'];

export class ProfileService {
    readonly client: BackendClient;
    readonly jotai: Jotai;
    readonly profile = atom<Profile | null>(null);
    #sync: InvalidateSync;
    #hadVoice = false;
    #hadPairing: string | null = null;

    constructor(client: BackendClient, jotai: Jotai) {
        this.client = client;
        this.jotai = jotai;

        // Load existing
        let existing = storageGetTyped('user-profile', ProfileSchema);
        if (existing) {
            this.jotai.set(this.profile, existing.body);
            posthogIdentity(existing.body.id)
        }

        // Run sync
        this.#sync = new InvalidateSync(async () => {

            // Report voice
            if (this.#hadVoice && !!this.#hadPairing && !storage.getBoolean('profile:voice-reported')) {
                log('[PRF]', 'Reporting voice for the first time.');
                await this.client.reportFirstVoiced(this.#hadPairing);
                storage.set('profile:voice-reported', true);
            }

            // Report voice
            if (!!this.#hadPairing && !storage.getBoolean('profile:pairing-reported')) {
                log('[PRF]', 'Reporting pairing for the first time.');
                await this.client.reportFirstPaired(this.#hadPairing);
                storage.set('profile:pairing-reported', true);
            }

            // Load
            let loaded = await this.client.me();

            // Update profile
            this.jotai.set(this.profile, loaded);
            posthogIdentity(loaded.id)
            storageSetTyped('user-profile', ProfileSchema, { version: 3, body: loaded } satisfies ProfileStorage);
        });
        this.#sync.invalidate();

        // Refresh on app visible
        AppState.addEventListener('change', () => {
            if (AppState.currentState === 'active') {
                this.#sync.invalidate();
            }
        });
    }

    enableDeveloperMode = async () => {
        await backoff(() => this.client.updateDeveloperMode(true));
        await this.reloadProfile();
    }

    reloadProfile = async () => {
        await this.#sync.invalidateAndAwait();
    }

    reportVoice = () => {
        if (!this.#hadVoice) {
            this.#hadVoice = true;
            this.#sync.invalidate();
        }
    }

    reportPairing = (vendor: string) => {
        if (!this.#hadPairing) {
            this.#hadPairing = vendor;
            this.#sync.invalidate();
        }
    }

    use = () => {
        return useAtomValue(this.profile);
    }

    useDeveloperMode = () => {
        let profile = useAtomValue(this.profile);
        return profile?.roles.includes('developer') ?? false;
    }

    useExperimentalMode = () => {
        let profile = useAtomValue(this.profile);
        return profile?.roles.includes('experimental') || __DEV__;
    }
}