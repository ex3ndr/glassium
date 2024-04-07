import { SuperClient } from "../api/client";
import { CaptureSession } from './CaptureSession';

export class AppState {
    readonly client: SuperClient;
    session: CaptureSession | null = null;

    constructor(client: SuperClient) {
        this.client = client;
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