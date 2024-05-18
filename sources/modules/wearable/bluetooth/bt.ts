import * as b64 from 'react-native-quick-base64';
import { BleManager, BleRestoredState, Device, State, Subscription } from "react-native-ble-plx";
import { BTDevice, BTDiscoveredDevice, BTService, BluetoothModelInterface, BluetoothStartResult } from "./types";
import { PermissionsAndroid, Platform } from 'react-native';
import { log } from '../../../utils/logs';
import { uptime } from '../../../utils/uptime';
import { track } from '../../track/track';

export class BluetoothService implements BluetoothModelInterface {
    static readonly isPersistent: boolean = true;
    static readonly supportsScan: boolean = true;
    static readonly supportsPick: boolean = false;

    #manager: BleManager;
    #scanning = false;

    constructor() {
        this.#manager = new BleManager({
            restoreStateIdentifier: 'bubble-bluetooth',
            restoreStateFunction: (restoredState) => { this.#onRestored(restoredState); }
        });
    }

    async start(): Promise<BluetoothStartResult> {
        let res = await new Promise<BluetoothStartResult>((resolve) => {

            // Helpers
            let subscription: Subscription | null = null;
            let ended = false;
            function complete(result: BluetoothStartResult) {
                if (!ended) {
                    ended = true;
                    if (subscription !== null) {
                        subscription.remove();
                        subscription = null;
                    }
                    resolve(result);
                }
            }

            // Subscribe
            subscription = this.#manager.onStateChange(state => {
                console.log('Bluetooth state:', state);
                if (state === State.PoweredOn) {
                    complete('started');
                } else if (state === State.Unsupported) {
                    complete('failure');
                } else if (state === State.Unauthorized) {
                    complete('denied');
                } else if (state === State.PoweredOff) {
                    // Ignore
                } else if (state === State.Resetting) {
                    // Ignore
                }
            });

            // Check initial
            (async () => {
                let state = await this.#manager.state();
                console.log('Initial state:', state);
                if (state === State.PoweredOn) {
                    complete('started');
                } else if (state === State.Unsupported) {
                    complete('failure');
                } else if (state === State.Unauthorized) {
                    complete('denied');
                }
            })()
        });

        // Handle android permissions
        if (Platform.OS === 'android' && res === 'started') {
            const result = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
            ])

            let allowed = result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED && result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED;

            if (!allowed) {
                return 'denied';
            }
        }

        return res;
    }

    startScan(handler: (device: BTDiscoveredDevice) => void) {
        if (this.#scanning) {
            throw new Error('Already scanning');
        }
        this.#scanning = true;
        let reported = new Set<string>();
        this.#manager.startDeviceScan(null, null, (error, device) => {
            if (device && device.name && !reported.has(device.id)) {
                reported.add(device.id);
                handler({ id: device.id, name: device.name, services: device.serviceUUIDs ? device.serviceUUIDs : [] });
            }
        });
    }

    stopScan(): void {
        if (!this.#scanning) {
            throw new Error('Not scanning');
        }
        this.#scanning = false;
        this.#manager.stopDeviceScan();
    }

    async connect(id: string, timeout: number): Promise<BTDevice | null> {

        // Connect to the device
        let btDevice: Device;
        let start = uptime();
        log('Bluetooth', 'Connecting to device:' + id)
        try {
            let devPromise = this.#manager.connectToDevice(id, {
                requestMTU: 250,
                // timeout: 5000 // NOTE: There is a bug in the library that causes this to drop connections on Android
            });

            // Implement timeout
            let timeoutPromise = new Promise<Device | null>((resolve) => { setTimeout(() => resolve(null), timeout) });
            let resolved = await Promise.any([devPromise, timeoutPromise]);
            if (!resolved) {
                return null;
            }
            btDevice = resolved as Device;
        } catch (error) {
            // console.error(error);
            return null;
        }
        let elapsed = uptime() - start;
        track('ble_connected', { elapsed });
        log('BT', 'Device connected in ' + elapsed + 'ms');

        // Collect all services and characteristics
        start = uptime();
        await this.#manager.discoverAllServicesAndCharacteristicsForDevice(btDevice.id);
        elapsed = uptime() - start;
        track('ble_services_loaded', { elapsed });
        log('BT', 'Services loaded in ' + elapsed + 'ms');

        // Paramters
        let name = btDevice.name || 'Unknown';
        let services: BTService[] = [];

        // Populate services
        for (let s of await btDevice.services()) {
            let characteristics = await s.characteristics();
            services.push({
                id: s.uuid,
                characteristics: characteristics.map(c => ({
                    id: c.uuid,
                    name: c.id,
                    canRead: c.isReadable,
                    canWrite: c.isWritableWithoutResponse || c.isWritableWithResponse,
                    canNotify: c.isNotifiable,
                    read: async () => {
                        let value = await c.read();
                        return b64.toByteArray(value.value!);
                    },
                    write: async (data: Uint8Array) => {
                        await c.writeWithResponse(b64.fromByteArray(data));
                    },
                    subscribe: (callback: (data: Uint8Array) => void) => {
                        let subs = c.monitor((error, value) => {
                            if (error) {
                                // console.error(error);
                            } else {
                                callback(b64.toByteArray(value!.value!));
                            }
                        });
                        return () => {
                            subs.remove();
                        };
                    }
                }))
            });
        }

        // Connected state (what about race conditions here?)
        let connected = true;
        let callbacks = new Set<() => void>();
        connected = await btDevice.isConnected();
        let deviceDisconnectSubscription: Subscription | null = null;
        if (connected) {
            deviceDisconnectSubscription = this.#manager.onDeviceDisconnected(id, () => {

                // Remove subscription
                if (deviceDisconnectSubscription !== null) {
                    deviceDisconnectSubscription.remove();
                    deviceDisconnectSubscription = null;
                }

                // Update state
                connected = false;

                // Notify
                for (let cb of callbacks) {
                    cb();
                }
            });
        }

        // Wrapper
        return {
            id,
            name,
            services,
            get connected() {
                return connected
            },
            onDisconnected(callback) {
                callbacks.add(callback);
                return () => {
                    callbacks.delete(callback);
                };
            },
            async disconnect() {
                if (connected) {
                    await btDevice.cancelConnection();
                }
            }
        };
    }

    async pick(services: string[]): Promise<BTDiscoveredDevice | null> {
        throw new Error('Not supported');
    }

    #onRestored = (restoredState: BleRestoredState | null) => {
        console.warn('Bluetooth restored state:', restoredState);
    }

    destroy() {
        this.#manager.destroy();
    }
}