import { createStore } from "jotai";
import { SuperClient } from "../api/client";
import { CaptureSession } from './CaptureSession';
import { SessionsModel } from "./SessionsModel";
import { WearableModel } from "./WearableModel";
import { Jotai } from "./Jotai";
import { UpdatesModel } from "./UpdatesModel";
import { Update } from "../api/client.schema";

export class AppModel {
    readonly client: SuperClient;
    readonly jotai: Jotai;
    readonly sessions: SessionsModel;
    readonly wearable: WearableModel;
    readonly updates: UpdatesModel;
    private session: CaptureSession | null = null;

    constructor(client: SuperClient) {
        this.client = client;
        this.jotai = createStore();
        this.sessions = new SessionsModel(client, this.jotai);
        this.wearable = new WearableModel(this.jotai);
        this.updates = new UpdatesModel(client);
        this.updates.onUpdates = this.#handleUpdate;

        // Start
        this.updates.start();
        this.sessions.invalidate();
        this.wearable.start();
    }

    useSessions = () => {
        return this.sessions.use();
    }

    useWearable = () => {
        return this.wearable.use();
    }

    #handleUpdate = async (update: Update) => {
        console.warn(update);
        if (update.type === 'session-created') {
            this.sessions.apply({ id: update.id, index: update.index, state: 'starting' });
        } else if (update.type === 'session-updated') {
            this.sessions.applyPartial({ id: update.id, state: update.state });
        }
    }

    startSession = () => {
        if (!this.session) {
            this.session = new CaptureSession(this);
            this.session.start();
        }
    }

    stopSession = () => {
        if (this.session) {
            this.session.stop();
            this.session = null;
        }
    }
}