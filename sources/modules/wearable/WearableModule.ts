import { AsyncLock } from "teslabot";
import { connectToDevice, manager, startBluetooth } from "./protocol/bt";
import { Jotai } from "../state/_types";
import { atom, useAtomValue } from "jotai";
import { storage } from "../../storage";
import { ProtocolDefinition, resolveProtocol, supportedDeviceNames } from "./protocol/protocol";
import { DeviceModel } from "./DeviceModel";
import { DeviceProfile, loadDeviceProfile, profileCodec } from "./protocol/profile";
import { fromMulaw } from "./protocol/mulaw";
import { log } from "../../utils/logs";

export class WearableModule {
    private static lock = new AsyncLock(); // Use static lock to prevent multiple BT operations
    readonly jotai: Jotai;
    readonly pairingStatus = atom<'loading' | 'need-pairing' | 'ready' | 'denied' | 'unavailable'>('loading');
    readonly discoveryStatus = atom<{ devices: { name: string, id: string }[] } | null>(null);
    onStreamingStart?: (sr: 8000 | 16000) => void;
    onStreamingStop?: () => void;
    onStreamingFrame?: (data: Int16Array) => void;
    #device: DeviceModel | null = null;
    #profile: DeviceProfile | null = null;
    #protocol: ProtocolDefinition | null = null;
    #protocolMuted: boolean | null = null;
    #protocolTimeout: any | null = null;
    #protocolStarted = false;
    #needStreaming = false;
    readonly status = atom((get) => {
        let pairing = get(this.pairingStatus);
        if (pairing === 'ready') {
            return {
                pairing: 'ready' as const,
                device: get(this.#device!.state),
                profile: this.#profile
            };
        } else {
            return {
                pairing,
                device: null,
                profile: null
            };
        }
    });
    #discoveryCancel: (() => void) | null = null;

    constructor(jotai: Jotai) {
        this.jotai = jotai;
        let profile = storage.getString('wearable-device');
        if (profile) {
            let js;
            try {
                js = JSON.parse(profile);
            } catch (e) {
                return;
            }
            let parsed = profileCodec.safeParse(js);
            if (parsed.success) {
                this.#profile = parsed.data;
                this.#device = new DeviceModel(parsed.data.id, jotai);
                this.#device.onStreamingStart = this.#onStreamingStart;
                this.#device.onStreamingStop = this.#onStreamingStop;
                this.#device.onStreamingFrame = this.#onStreamingFrame;
                this.#device.onStreamingMute = this.#onStreamingMute;
                this.#device.init();
            }
        }
    }

    get device() {
        return this.#device;
    }

    get profile() {
        return this.#profile;
    }

    start = () => {
        WearableModule.lock.inLock(async () => {

            // Starting bluetooth
            let result = await startBluetooth();
            if (result === 'denied') {
                this.jotai.set(this.pairingStatus, 'denied');
                return;
            } else if (result === 'failure') {
                this.jotai.set(this.pairingStatus, 'unavailable');
                return;
            }

            // Not paired
            if (!this.#device) {
                this.jotai.set(this.pairingStatus, 'need-pairing');
                return;
            }

            // Connected
            this.jotai.set(this.pairingStatus, 'ready');
        });
    }

    //
    // Service Discovery
    //

    startDiscovery = () => {
        if (this.#discoveryCancel != null) {
            return;
        }

        // Start scan
        if (!this.jotai.get(this.discoveryStatus)) {
            this.jotai.set(this.discoveryStatus, { devices: [] });
        }
        manager().startDeviceScan(null, null, (error, device) => {
            if (device && device.name && supportedDeviceNames(device.name)) {
                let devices = this.jotai.get(this.discoveryStatus)!.devices;
                if (devices.find((v) => v.id === device.id)) {
                    return;
                }
                devices = [{ name: device.name, id: device.id }, ...devices];
                this.jotai.set(this.discoveryStatus, { devices });
            }
            if (error) {
                console.error(error);
            }
        });

        // Stop scan
        this.#discoveryCancel = () => {
            if (this.#discoveryCancel != null) {
                this.#discoveryCancel = null;
                manager().stopDeviceScan();
            }
        }
    }

    stopDiscrovery = () => {
        if (this.#discoveryCancel != null) {
            this.#discoveryCancel();
        }
    }

    resetDiscoveredDevices = () => {
        this.jotai.set(this.discoveryStatus, null);
    }

    //
    // Pairing
    //

    tryPairDevice = (id: string) => {
        return WearableModule.lock.inLock(async () => {
            if (!!this.#device) {
                return 'already-paired' as const;
            }

            // Connecting to device
            let connected = await connectToDevice(id);
            if (!connected) {
                return 'connection-error' as const;
            }

            // Check protocols
            const protocol = await resolveProtocol(connected);
            if (!protocol) {
                connected.disconnect();
                return 'unsupported' as const;
            }

            // Check profile
            let profile = await loadDeviceProfile(protocol, connected);
            if (!profile) {
                connected.disconnect();
                return 'unsupported' as const;
            }

            // Save device
            this.#device = new DeviceModel(connected, this.jotai, this.#needStreaming);
            this.#device.onStreamingStart = this.#onStreamingStart;
            this.#device.onStreamingStop = this.#onStreamingStop;
            this.#device.onStreamingFrame = this.#onStreamingFrame;
            this.#device.onStreamingMute = this.#onStreamingMute;
            this.#device.init();

            // Update state
            this.#profile = profile;
            storage.set('wearable-device', JSON.stringify(profile));
            this.jotai.set(this.pairingStatus, 'ready');

            return 'ok' as const;
        });
    }

    disconnectDevice = () => {
        return WearableModule.lock.inLock(async () => {
            if (!this.#device) {
                return 'not-paired' as const;
            }

            // Stop the device
            // This calls streaming stop callback synchronously 
            // and asynchronously cleanups the device
            this.#device!.stop();
            this.#device = null;

            // Update state
            storage.delete('wearable-device');
            this.jotai.set(this.pairingStatus, 'need-pairing');

            return 'ok' as const;
        });
    }

    //
    // Streaming
    //

    startStreaming = () => {
        if (this.#needStreaming) {
            return;
        }
        this.#needStreaming = true;
        log('BT', 'Need streaming = true');

        // Update device
        return WearableModule.lock.inLock(async () => {
            if (!this.#device) {
                return;
            }
            this.#device.startStreaming();
        });
    }

    stopStreaming = () => {
        if (!this.#needStreaming) {
            return;
        }
        this.#needStreaming = false;
        log('BT', 'Need streaming = false');

        // Update device
        return WearableModule.lock.inLock(async () => {
            if (!this.#device) {
                return;
            }
            this.#device.stopStreaming();
        });
    }

    #streamTimeoutCancel = () => {
        if (this.#protocolTimeout) {
            clearTimeout(this.#protocolTimeout);
            this.#protocolTimeout = null;
        }
    }

    #streamTimeoutBump = () => {
        this.#streamTimeoutCancel();
        this.#protocolTimeout = setTimeout(() => {
            if (this.#protocolStarted) {
                this.#protocolStarted = false;
                if (this.onStreamingStop) {
                    this.onStreamingStop();
                }
            }
        }, 5000);
    }

    #onStreamingStart = (protocol: ProtocolDefinition, mute: boolean) => {
        this.#protocolMuted = mute;
        this.#protocol = protocol;
    }

    #onStreamingMute = (mute: boolean) => {
        if (this.#protocolMuted === mute) {
            return;
        }
        this.#protocolMuted = mute;

        // Stop if muted
        if (mute) {
            this.#streamTimeoutCancel();
            if (this.#protocolStarted) {
                this.#protocolStarted = false;
                if (this.onStreamingStop) {
                    this.onStreamingStop();
                }
            }
        }
    }

    #onStreamingFrame = (data: Uint8Array) => {
        if (!this.#protocol || this.#protocolMuted) {
            return;
        }

        // If not started, start
        if (!this.#protocolStarted) {
            this.#protocolStarted = true;
            if (this.onStreamingStart) {
                let sr = (this.#protocol.codec === 'mulaw-8' || this.#protocol.codec === 'pcm-8') ? 8000 as const : 16000 as const;
                this.onStreamingStart(sr);
            }
        }

        // Update last frame time
        this.#streamTimeoutBump();

        // Callback
        if (this.onStreamingFrame) {

            // Source
            if (this.#protocol.kind === 'super') {
                // Cut the first 3 bytes
                data = data.subarray(3);
            }

            // Convert to frames
            let frames: Int16Array;
            if (this.#protocol.codec === 'pcm-16' || this.#protocol.codec === 'pcm-8') {
                frames = new Int16Array(data.length / 2);
                for (let f = 0; f < frames.length; f++) {
                    frames[f] = data[f * 2] | (data[f * 2 + 1] << 8);
                }
            } else {
                // Decode MuLaw
                frames = new Int16Array(data.length);
                for (let f = 0; f < frames.length; f++) {
                    frames[f] = fromMulaw(data[f]);
                }
            }

            // Callback
            this.onStreamingFrame(frames);
        }
    }

    #onStreamingStop = () => {

        // Reset state
        let wasStarted = this.#protocolStarted;
        this.#protocol = null;
        this.#protocolStarted = false;
        this.#streamTimeoutCancel();

        // Callback
        if (this.onStreamingStop && wasStarted) {
            this.onStreamingStop();
        }
    }

    //
    // UI
    //

    use() {
        return useAtomValue(this.status);
    }
}