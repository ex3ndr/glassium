import { createStore } from "jotai";
import { BackendClient } from "../api/client";
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
import { BackgroundService } from "./BackgroundService";
import PostHog from "posthog-react-native";
import { getPostHog } from "../track/track";
import { ProfileService } from "./ProfileService";
import { DebugService } from "./DebugService";
import { FeedService } from "./FeedService";
import { UserService } from "./UserService";
import { MemoryService } from "./MemoryService";
import { NotificationsService } from "./NotificationsService";
import { AppUpdateService } from "./AppUpdateService";

export class AppService {
    readonly client: BackendClient;
    readonly jotai: Jotai;
    readonly posthog: PostHog;
    readonly sessions: SessionsModel;
    readonly wearable: WearableModule;
    readonly updates: UpdatesModel;
    readonly sync: SyncModel;
    readonly capture: CaptureModule
    readonly realtime: RealtimeModel;
    readonly endpointing: EndpointingModule;
    readonly tokenExpire: TokenExpireService;
    readonly background: BackgroundService;
    readonly profile: ProfileService;
    readonly debug: DebugService;
    readonly users: UserService;
    readonly memory: MemoryService;
    readonly feed: FeedService;
    readonly notifications: NotificationsService;
    readonly appUpdates: AppUpdateService;

    constructor(client: BackendClient) {
        this.client = client;
        this.posthog = getPostHog();
        this.jotai = createStore();
        this.profile = new ProfileService(client, this.jotai);
        this.debug = new DebugService(this.jotai);
        this.sessions = new SessionsModel(client, this.jotai);
        this.wearable = new WearableModule(this.jotai, this.debug);
        this.sync = new SyncModel(client);
        this.realtime = new RealtimeModel(client, this.jotai);
        this.endpointing = new EndpointingModule(this.sync, this.jotai, this.profile);
        this.capture = new CaptureModule(this.jotai, this.wearable, this.endpointing, this.realtime);
        this.updates = new UpdatesModel(client);
        this.tokenExpire = new TokenExpireService(client);
        this.background = new BackgroundService();
        this.users = new UserService(client);
        this.memory = new MemoryService(client);
        this.feed = new FeedService(client, this.jotai, this.users, this.memory);
        this.notifications = new NotificationsService(client);
        this.appUpdates = new AppUpdateService();
        this.updates.onUpdates = this.#handleUpdate;
        this.wearable.onStreamingStart = this.capture.onCaptureStart;
        this.wearable.onStreamingStop = this.capture.onCaptureStop;
        this.wearable.onStreamingFrame = this.capture.onCaptureFrame;
        this.wearable.onDevicePaired = this.#onDevicePaired;
        this.wearable.onDeviceUnpaired = this.#onDeviceUnpaired;
        if (this.wearable.profile) {
            this.background.start();
            this.profile.reportPairing(this.wearable.profile.vendor);
        }

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

    #onDevicePaired = () => {
        this.background.start();
        if (this.wearable.profile) {
            this.profile.reportPairing(this.wearable.profile.vendor);
        }
    }

    #onDeviceUnpaired = () => {
        this.background.stop();
    }

    #handleUpdate = async (update: Update) => {
        // console.warn(update);
        if (update.type === 'session-created') {
            this.sessions.apply({ id: update.id, index: update.index, state: 'starting', audio: null, classification: null, created: update.created });
        } else if (update.type === 'session-updated') {
            this.sessions.applyPartial({ id: update.id, state: update.state });
        } else if (update.type === 'session-audio-updated') {
            this.sessions.applyPartial({ id: update.id, audio: update.audio });
        } else if (update.type === 'session-transcribed') {
            this.sessions.applyPartialFull({ id: update.id, text: update.transcription });
        } else if (update.type === 'session-classified') {
            this.sessions.applyPartial({ id: update.id, classification: update.class });
        } else if (update.type === 'feed-posted') {
            this.feed.onUpdate(update);
        }
    }
}