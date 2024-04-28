import { createStore } from "jotai";
import { SuperClient } from "../api/client";
import { SessionsModel } from "./SessionsModel";
import { WearableModule } from "../wearable/WearableModule";
import { Jotai } from "./_types";
import { UpdatesModel } from "./UpdatesModel";
import { Update } from "../api/schema";
import { CaptureModule } from "../capture/CaptureModule";
import { SyncModel } from "../capture/SyncModel";
import { RealtimeModel } from "./RealtimeModel";
import { EndpointingModule } from "../capture/EndpointingModule";
import { TokenExpireService } from "./TokenExpireService";

export class AppModel {
    readonly client: SuperClient;
    readonly jotai: Jotai;
    readonly sessions: SessionsModel;
    readonly wearable: WearableModule;
    readonly updates: UpdatesModel;
    readonly sync: SyncModel;
    readonly capture: CaptureModule
    readonly realtime: RealtimeModel;
    readonly endpointing: EndpointingModule;
    readonly tokenExpire: TokenExpireService;

    constructor(client: SuperClient) {
        this.client = client;
        this.jotai = createStore();
        this.sessions = new SessionsModel(client, this.jotai);
        this.wearable = new WearableModule(this.jotai);
        this.sync = new SyncModel(client);
        this.realtime = new RealtimeModel(client, this.jotai);
        this.endpointing = new EndpointingModule(this.sync, this.jotai);
        this.capture = new CaptureModule(this.jotai, this.wearable, this.endpointing);
        this.updates = new UpdatesModel(client);
        this.tokenExpire = new TokenExpireService(client);
        this.updates.onUpdates = this.#handleUpdate;
        this.wearable.onStreamingStart = this.capture.onCaptureStart;
        this.wearable.onStreamingStop = this.capture.onCaptureStop;
        this.wearable.onStreamingFrame = this.capture.onCaptureFrame;

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
            this.sessions.apply({ id: update.id, index: update.index, state: 'starting', audio: null });
        } else if (update.type === 'session-updated') {
            this.sessions.applyPartial({ id: update.id, state: update.state });
        } else if (update.type === 'session-audio-updated') {
            this.sessions.applyPartial({ id: update.id, audio: update.audio });
        } else if (update.type === 'session-transcribed') {
            this.sessions.applyPartialFull({ id: update.id, text: update.transcription });
        }
    }
}