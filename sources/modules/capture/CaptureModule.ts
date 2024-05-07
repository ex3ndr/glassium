import { atom, useAtomValue } from "jotai";
import { Jotai } from "../state/_types";
import { WearableModule } from "../wearable/WearableModule";
import { EndpointingModule } from "./EndpointingModule";
import { storage } from "../../storage";
import { log } from "../../utils/logs";
import { AsyncLock } from "../../utils/lock";
import { RealtimeModel } from "../state/RealtimeModel";

export class CaptureModule {

    // Sync state
    readonly jotai: Jotai;
    readonly wearables: WearableModule;
    readonly endpointing: EndpointingModule;
    // readonly realtime: RealtimeModel;
    readonly captureState;

    // State
    private muted = false;
    private lastSR: 8000 | 16000 | null = null;
    private asyncLock = new AsyncLock();

    constructor(jotai: Jotai, wearables: WearableModule, endpointing: EndpointingModule, realtime: RealtimeModel) {
        this.jotai = jotai;
        this.wearables = wearables;
        this.endpointing = endpointing;
        // this.realtime = realtime;
        this.muted = storage.getBoolean('settings-local-mute') || false;
        if (!this.muted) {
            this.wearables.startStreaming();
        } else {
            this.wearables.stopStreaming();
        }
        this.captureState = atom<{ localMute: boolean, streaming: boolean }>({ localMute: this.muted, streaming: false });
    }

    setLocalMute = async (mute: boolean) => {
        log('CPT', 'setLocalMute(' + mute + ')');
        try {
            await this.asyncLock.inLock(async () => {
                if (this.muted === mute) {
                    return;
                }
                if (mute) {
                    if (this.lastSR !== null) {
                        // this.realtime.onCaptureStop();
                        await this.endpointing.onDeviceStreamStop();
                    }
                } else {
                    if (this.lastSR !== null) {
                        // this.realtime.onCaptureStart();
                        await this.endpointing.onDeviceStreamStart(this.lastSR);
                    }
                }
                if (!mute) {
                    this.wearables.startStreaming();
                } else {
                    this.wearables.stopStreaming();
                }
                this.muted = mute;
                storage.set('settings-local-mute', mute);
                this.jotai.set(this.captureState, { localMute: mute, streaming: this.lastSR !== null });

            });
        } catch (e) {
            log('CPT', 'setLocalMute Error: ' + e);
        }
    }

    use = () => {
        return useAtomValue(this.captureState);
    }

    //
    // Capture Callbacks
    //

    onCaptureStart = (sr: 8000 | 16000) => {
        this.asyncLock.inLock(async () => {
            this.lastSR = sr;
            if (!this.muted) {
                // this.realtime.onCaptureStart();
                await this.endpointing.onDeviceStreamStart(sr);
                this.jotai.set(this.captureState, { localMute: this.muted, streaming: true });
            }
        });
    }

    onCaptureFrame = (frames: Int16Array) => {
        this.asyncLock.inLock(async () => {
            if (!this.muted) {
                // this.realtime.onCaptureFrame(frames, this.lastSR!);
                await this.endpointing.onDeviceFrame(frames);
            }
        });
    }

    onCaptureStop = () => {
        log('CPT', 'onCaptureStop');
        this.asyncLock.inLock(async () => {
            if (!this.muted) {
                // this.realtime.onCaptureStop();
                await this.endpointing.onDeviceStreamStop();
                this.jotai.set(this.captureState, { localMute: this.muted, streaming: false });
            }
        });
    }
}