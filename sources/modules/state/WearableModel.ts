import { AsyncLock } from "teslabot";
import { connectToDevice, manager, startBluetooth } from "../wearable/bt";
import { Jotai } from "./_types";
import { atom, useAtomValue } from "jotai";
import { storage } from "../../storage";
import { ProtocolDefinition, resolveProtocol, supportedDeviceNames } from "../wearable/protocol";
import { DeviceModel } from "./DeviceModel";

export class WearableModel {
    private static lock = new AsyncLock(); // Use static lock to prevent multiple BT operations
    readonly jotai: Jotai;
    readonly pairingStatus = atom<'loading' | 'need-pairing' | 'ready' | 'denied' | 'unavailable'>('loading');
    readonly discoveryStatus = atom<{ devices: { name: string, id: string }[] } | null>(null);
    onStreamingStart?: (protocol: ProtocolDefinition) => void;
    onStreamingStop?: () => void;
    onStreamingFrame?: (data: Uint8Array) => void;
    #device: DeviceModel | null = null;
    #needStreaming = false;
    readonly status = atom((get) => {
        let pairing = get(this.pairingStatus);
        if (pairing === 'ready') {
            return {
                pairing: 'ready' as const,
                device: get(this.#device!.state),
            };
        } else {
            return {
                pairing,
                device: null
            };
        }
    });
    #discoveryCancel: (() => void) | null = null;

    constructor(jotai: Jotai) {
        this.jotai = jotai;
        let id = storage.getString('wearable-device');
        if (id) {
            this.#device = new DeviceModel(id, jotai);
            this.#device.onStreamingStart = this.#onStreamingStart;
            this.#device.onStreamingStop = this.#onStreamingStop;
            this.#device.onStreamingFrame = this.#onStreamingFrame;
            this.#device.init();
        }
    }

    get device() {
        return this.#device;
    }

    start = () => {
        WearableModel.lock.inLock(async () => {

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
        return WearableModel.lock.inLock(async () => {
            if (!!this.#device) {
                return 'already-paired' as const;
            }

            // Connecting to device
            let connected = await connectToDevice(id);
            if (!connected) {
                return 'connection-error' as const;
            }

            // Check protocols
            const protocol = resolveProtocol(connected);
            if (!protocol) {
                connected.disconnect();
                return 'unsupported' as const;
            }

            // Save device
            this.#device = new DeviceModel(connected, this.jotai, this.#needStreaming);
            this.#device.onStreamingStart = this.#onStreamingStart;
            this.#device.onStreamingStop = this.#onStreamingStop;
            this.#device.onStreamingFrame = this.#onStreamingFrame;
            this.#device.init();

            // Update state
            storage.set('wearable-device', id);
            this.jotai.set(this.pairingStatus, 'ready');

            return 'ok' as const;
        });
    }

    disconnectDevice = () => {
        return WearableModel.lock.inLock(async () => {
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

        // Update device
        return WearableModel.lock.inLock(async () => {
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

        // Update device
        return WearableModel.lock.inLock(async () => {
            if (!this.#device) {
                return;
            }
            this.#device.stopStreaming();
        });
    }

    #onStreamingStart = (protocol: ProtocolDefinition) => {
        if (this.onStreamingStart) {
            this.onStreamingStart(protocol);
        }
    }

    #onStreamingStop = () => {
        if (this.onStreamingStop) {
            this.onStreamingStop();
        }
    }

    #onStreamingFrame = (data: Uint8Array) => {
        if (this.onStreamingFrame) {
            this.onStreamingFrame(data);
        }
    }

    //
    // UI
    //

    use() {
        return useAtomValue(this.status);
    }
}