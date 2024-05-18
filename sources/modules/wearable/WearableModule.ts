import { Jotai } from "../services/_types";
import { atom, useAtomValue } from "jotai";
import { storage } from "@/storage";
import { ProtocolDefinition, resolveProtocol } from "@/modules/wearable/protocol/protocol";
import { DeviceModel } from "@/modules/wearable/DeviceModel";
import { DeviceProfile, loadDeviceProfile, profileCodec } from "@/modules/wearable/protocol/profile";
import { log } from "@/utils/logs";
import { Platform } from "react-native";
import { AudioCodec, createCodec, createSkipCodec } from "@/modules/media/audioCodec";
import { BluetoothService } from "@/modules/wearable/bluetooth/bt";
import { isDiscoveredDeviceSupported } from "@/modules/wearable/protocol/scan";
import { bluetoothServices } from "@/modules/wearable/protocol/services";
import { track } from "@/modules/track/track";
import { uptime } from "@/utils/uptime";
import { AsyncLock } from "@/utils/lock";
import { DebugService } from "@/modules/services/DebugService";

let bluetoothRef: BluetoothService | null = null;

export function bluetooth() {
    if (!bluetoothRef) {
        bluetoothRef = new BluetoothService();
    }
    return bluetoothRef;
}

export class WearableModule {

    static loadProfile(): DeviceProfile | null {
        if (BluetoothService.isPersistent) {
            let profile = storage.getString('wearable-device');
            if (profile && Platform.OS !== 'web') {
                let js;
                try {
                    js = JSON.parse(profile);
                    let parsed = profileCodec.safeParse(js);
                    if (parsed.success) {
                        return parsed.data;
                    }
                } catch (e) {
                    return null;
                }
            }
        }
        return null;
    }

    static saveProfile(profile: DeviceProfile | null) {
        if (profile) {
            storage.set('wearable-device', JSON.stringify(profile));
        } else {
            storage.delete('wearable-device');
        }
    }

    private static lock = new AsyncLock(); // Use static lock to prevent multiple BT operations
    readonly debug: DebugService;
    readonly jotai: Jotai;
    readonly pairingStatus = atom<'loading' | 'need-pairing' | 'ready' | 'denied' | 'unavailable'>('loading');
    readonly discoveryStatus = atom<{ devices: { name: string, id: string }[] } | null>(null);
    onDevicePaired?: () => void;
    onDeviceUnpaired?: () => void;
    onStreamingStart?: (sr: 8000 | 16000) => void;
    onStreamingStop?: () => void;
    onStreamingFrame?: (data: Int16Array) => void;
    #lastDropNotification = uptime();
    #startAt = uptime();
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
                profile: this.#profile
            };
        }
    });
    #discoveryCancel: (() => void) | null = null;

    constructor(jotai: Jotai, debug: DebugService) {
        this.jotai = jotai;
        this.debug = debug;

        // Auto-load if persisted
        let profile = WearableModule.loadProfile();
        if (profile) {
            this.#profile = profile;
            this.#device = new DeviceModel(profile.id, jotai, bluetooth());
            this.#device.onStreamingStart = this.#onStreamingStart;
            this.#device.onStreamingStop = this.#onStreamingStop;
            this.#device.onStreamingFrame = this.#onStreamingFrame;
            this.#device.onStreamingMute = this.#onStreamingMute;
            this.#device.init();
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
            let result = await bluetooth().start();
            if (result === 'denied') {
                this.jotai.set(this.pairingStatus, 'denied');
                track('wearable_bluetooth_denied');
                return;
            } else if (result === 'failure') {
                this.jotai.set(this.pairingStatus, 'unavailable');
                track('wearable_bluetooth_unavailable');
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
        bluetooth().startScan((device) => {
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
                bluetooth().stopScan();
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
        let picked = await bluetooth().pick(Object.values(bluetoothServices));
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
            let connected = await bluetooth().connect(id, 5000);
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
            this.#device = new DeviceModel(connected, this.jotai, bluetooth(), this.#needStreaming);
            this.#device.onStreamingStart = this.#onStreamingStart;
            this.#device.onStreamingStop = this.#onStreamingStop;
            this.#device.onStreamingFrame = this.#onStreamingFrame;
            this.#device.onStreamingMute = this.#onStreamingMute;
            this.#device.init();

            // Update state
            WearableModule.saveProfile(profile);
            this.jotai.set(this.pairingStatus, 'ready');
            track('wearable_device_added');

            // Notify
            if (this.onDevicePaired) {
                this.onDevicePaired();
            }

            // Debug
            this.debug.onDeviceConnected(protocol);

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
            WearableModule.saveProfile(null);
            this.jotai.set(this.pairingStatus, 'need-pairing');
            track('wearable_device_removed');

            // Notify
            if (this.onDeviceUnpaired) {
                this.onDeviceUnpaired();
            }

            // Debug
            this.debug.onDeviceDisconnected();

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
        track('wearable_local_mute', { mute: false });

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
        track('wearable_local_mute', { mute: true });

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
            track('wearable_streaming_timeout');
            this.#protocolTimeout = null;
            if (this.#protocolStarted) {
                this.#protocolStarted = false;
                this.#notifyStreamingStop();
            }
        }, 5000);
    }

    #onStreamingStart = (protocol: ProtocolDefinition, mute: boolean) => {
        track('wearable_streaming_start', { device_kind: protocol.kind, codec: protocol.codec, mute: false });
        this.#startAt = uptime();
        this.#protocolMuted = mute;
        this.#protocol = protocol;

        // Resolve codec
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
        track('wearable_streaming_mute', { mute });

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
                this.#notifyStreamingStop();
            }
        }
    }

    #onStreamingFrame = (data: Uint8Array) => {
        if (!this.#protocol || this.#protocolMuted) {
            if (this.#lastDropNotification + 1000 < uptime()) {
                log('BT', 'Streaming frame dropped, because: ' + (!this.#protocol ? 'no protocol' : 'muted'));
                this.#lastDropNotification = uptime();
            }
            return;
        }

        // If not started, start
        if (!this.#protocolStarted) {
            this.#protocolStarted = true;
            this.#notifyStreamingStart(this.#protocol.samplingRate);
        }

        // Update last frame time
        this.#streamTimeoutBump();

        // Callback
        // if (this.onStreamingFrame) {

        // Source
        if (this.#protocol.kind === 'super') {
            // Cut the first 3 bytes
            data = data.slice(3); // Slice array breaks some optimizations
        }

        // Convert to samples
        let samples = this.#protocolCodec!.decode(data);

        // Notify
        this.#notifyStreamingFrame(samples);
    }

    #onStreamingStop = () => {
        log('BT', 'Streaming stopped');
        track('wearable_streaming_stop', { duration: uptime() - this.#startAt });

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
        if (wasStarted) {
            this.#notifyStreamingStop();
        }
    }

    //
    // Notifications
    //

    #notifyStreamingStart = (sr: 8000 | 16000) => {

        // Debug
        this.debug.onCaptureStart(sr);

        // Callback
        if (this.onStreamingStart) {
            this.onStreamingStart(sr);
        }
    }

    #notifyStreamingFrame = (data: Int16Array) => {

        // Debug
        this.debug.onCaptureFrame(data);

        // Callback
        if (this.onStreamingFrame) {
            this.onStreamingFrame(data);
        }
    }

    #notifyStreamingStop = () => {

        // Debug
        this.debug.onCaptureStop();

        // Callback
        if (this.onStreamingStop) {
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