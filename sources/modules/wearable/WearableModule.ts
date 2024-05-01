import { AsyncLock } from "teslabot";
import { Jotai } from "../state/_types";
import { atom, useAtomValue } from "jotai";
import { storage } from "../../storage";
import { ProtocolDefinition, resolveProtocol } from "./protocol/protocol";
import { DeviceModel } from "./DeviceModel";
import { DeviceProfile, loadDeviceProfile, profileCodec } from "./protocol/profile";
import { log } from "../../utils/logs";
import { Platform } from "react-native";
import { AudioCodec, createCodec, createSkipCodec } from "../media/audioCodec";
import { BluetoothModel } from "./bluetooth/bt";
import { isDiscoveredDeviceSupported } from "./protocol/scan";
import { bluetoothServices } from "./protocol/services";

export class WearableModule {
    private static lock = new AsyncLock(); // Use static lock to prevent multiple BT operations
    readonly jotai: Jotai;
    readonly pairingStatus = atom<'loading' | 'need-pairing' | 'ready' | 'denied' | 'unavailable'>('loading');
    readonly discoveryStatus = atom<{ devices: { name: string, id: string }[] } | null>(null);
    readonly bluetooth = new BluetoothModel();
    onDevicePaired?: () => void;
    onDeviceUnpaired?: () => void;
    onStreamingStart?: (sr: 8000 | 16000) => void;
    onStreamingStop?: () => void;
    onStreamingFrame?: (data: Int16Array) => void;
    #device: DeviceModel | null = null;
    #profile: DeviceProfile | null = null;
    #protocol: ProtocolDefinition | null = null;
    #protocolCodec: AudioCodec | null = null;
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

        // Auto-load if persistent
        if (this.bluetooth.isPersistent) {
            let profile = storage.getString('wearable-device');
            if (profile && Platform.OS !== 'web') {
                let js;
                try {
                    js = JSON.parse(profile);
                } catch (e) {
                    return;
                }
                let parsed = profileCodec.safeParse(js);
                if (parsed.success) {
                    this.#profile = parsed.data;
                    this.#device = new DeviceModel(parsed.data.id, jotai, this.bluetooth);
                    this.#device.onStreamingStart = this.#onStreamingStart;
                    this.#device.onStreamingStop = this.#onStreamingStop;
                    this.#device.onStreamingFrame = this.#onStreamingFrame;
                    this.#device.onStreamingMute = this.#onStreamingMute;
                    this.#device.init();
                }
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
            let result = await this.bluetooth.start();
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
        this.bluetooth.startScan((device) => {
            if (isDiscoveredDeviceSupported(device)) {
                let devices = this.jotai.get(this.discoveryStatus)!.devices;
                devices = [{ name: device.name, id: device.id }, ...devices.filter((v) => v.id !== device.id)];
                this.jotai.set(this.discoveryStatus, { devices });
            }
        });

        // Stop scan
        this.#discoveryCancel = () => {
            if (this.#discoveryCancel != null) {
                this.#discoveryCancel = null;
                this.bluetooth.stopScan();
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

    pick = async () => {
        let picked = await this.bluetooth.pick(Object.values(bluetoothServices));
        if (picked) {
            return this.tryPairDevice(picked.id);
        }
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
            let connected = await this.bluetooth.connect(id);
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
            const profile = await loadDeviceProfile(protocol, connected);
            if (!profile) {
                connected.disconnect();
                return 'unsupported' as const;
            }

            // Save device
            this.#profile = profile;
            this.#device = new DeviceModel(connected, this.jotai, this.bluetooth, this.#needStreaming);
            this.#device.onStreamingStart = this.#onStreamingStart;
            this.#device.onStreamingStop = this.#onStreamingStop;
            this.#device.onStreamingFrame = this.#onStreamingFrame;
            this.#device.onStreamingMute = this.#onStreamingMute;
            this.#device.init();

            // Update state
            storage.set('wearable-device', JSON.stringify(profile));
            this.jotai.set(this.pairingStatus, 'ready');

            // Notify
            if (this.onDevicePaired) {
                this.onDevicePaired();
            }

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

            // Notify
            if (this.onDeviceUnpaired) {
                this.onDeviceUnpaired();
            }

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
            log('BT', 'Streaming timeout');
            this.#protocolTimeout = null;
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
        let codec: AudioCodec;
        if (protocol.codec === 'pcm-16' || protocol.codec === 'pcm-8') {
            codec = createCodec('pcm');
        } else if (protocol.codec === 'mulaw-8' || protocol.codec === 'mulaw-16') {
            codec = createCodec('mulaw');
        } else if (protocol.codec === 'opus-16') {
            codec = createCodec('opus');
        } else {
            throw Error('Impossible');
        }
        codec = createSkipCodec(codec, protocol.codec === 'mulaw-8' || protocol.codec === 'pcm-8' ? 1600 : 3200); // Skip 200ms
        if (!mute) {
            codec.start();
        }
        this.#protocolCodec = codec;
    }

    #onStreamingMute = (mute: boolean) => {
        if (this.#protocolMuted === mute) {
            return;
        }
        this.#protocolMuted = mute;

        // Update codec
        if (this.#protocolCodec) {
            if (mute) {
                this.#protocolCodec.stop();
            } else {
                this.#protocolCodec.start();
            }
        }

        // Stop if muted
        if (mute) {
            this.#streamTimeoutCancel();
            if (this.#protocolStarted) {
                this.#protocolStarted = false;
                log('BT', 'Streaming stopped on mute');
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
                data = data.slice(3); // Slice array breaks some optimizations
            }

            // Convert to samples
            let samples = this.#protocolCodec!.decode(data);

            // Callback
            this.onStreamingFrame(samples);
        }
    }

    #onStreamingStop = () => {
        log('BT', 'Streaming stopped');

        // Reset state
        let wasStarted = this.#protocolStarted;
        this.#protocol = null;
        this.#protocolStarted = false;
        this.#streamTimeoutCancel();
        if (this.#protocolCodec) {
            if (!this.#protocolMuted) {
                this.#protocolCodec.stop();
            }
            this.#protocolCodec = null;
        }

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