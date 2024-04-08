import { createStore } from "jotai";
import { SuperClient } from "../api/client";
import { CaptureSession } from './CaptureSession';
import { SessionsModel } from "./SessionsModel";
import { WearableModel } from "./WearableModel";
import { Jotai } from "./Jotai";

export class AppModel {
    readonly client: SuperClient;
    readonly jotai: Jotai;
    readonly sessions: SessionsModel;
    readonly wearable: WearableModel;
    private session: CaptureSession | null = null;

    constructor(client: SuperClient) {
        this.client = client;
        this.jotai = createStore();
        this.sessions = new SessionsModel(client, this.jotai);
        this.wearable = new WearableModel(this.jotai);

        // Start
        this.sessions.invalidate();
        this.wearable.start();
    }

    useSessions = () => {
        return this.sessions.use();
    }

    useWearable = () => {
        return this.wearable.use();
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