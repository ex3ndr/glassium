import { createStore } from "jotai";
import { SuperClient } from "../api/client";
import { CaptureSession } from './CaptureSession';
import { SessionsModel } from "./SessionsModel";

export class AppState {
    readonly client: SuperClient;
    private session: CaptureSession | null = null;
    readonly store: ReturnType<typeof createStore>;
    readonly sessions: SessionsModel;

    constructor(client: SuperClient) {
        this.client = client;
        this.store = createStore();
        this.sessions = new SessionsModel(client, this.store);

        // Start
        this.sessions.invalidate();
    }

    useSessions = () => {
        return this.sessions.use();
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