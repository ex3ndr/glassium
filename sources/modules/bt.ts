import { PermissionsAndroid, Platform } from 'react-native';
import * as b64 from 'react-native-quick-base64';
import { BleManager, Device, ScanOptions, State, Subscription } from 'react-native-ble-plx';
import { BTDevice, BTService, BTStartResult } from './bt_common';

let _manager: BleManager | null = null;
function manager() {
    if (_manager === null) {
        _manager = new BleManager();
    }
    return _manager;
}

export async function startBluetooth(): Promise<BTStartResult> {

    let m = manager();
    return new Promise<BTStartResult>((resolve, reject) => {

        // Helpers
        let subscription: Subscription | null = null;
        let ended = false;
        function complete(result: BTStartResult) {
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
        subscription = m.onStateChange(state => {
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
            let state = await m.state();
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
}

export async function openDevice(params: { name: string[] } | { services: string[] }): Promise<BTDevice | null> {
    let m = manager();

    // Load device
    let btDevice = await new Promise<Device | null>((resolve, reject) => {
        let uuids: string[] | null = null;
        let options: ScanOptions | null = null;
        let ended = false;
        function end(device: Device | null) {
            if (!ended) {
                ended = true;
                m.stopDeviceScan();
                resolve(device);
            }
        }
        m.startDeviceScan(uuids, options, (error, device) => {
            console.log('Device:', device?.id, device?.name);
            console.log('Error:', error);
            if (!!device) {
                if ('name' in params) {
                    if (params.name.includes(device.name!)) {
                        end(device);
                    }
                } else {
                    end(device);
                }
            }
            if (error) {
                console.error(error);
                end(null);
            }
        });
    });
    if (btDevice === null) {
        return null;
    }

    let id = btDevice.id;
    let name = btDevice.name || 'Unknown';
    let services: BTService[] = [];

    // Connect to device
    await btDevice.connect({ requestMTU: 128 });
    await m.discoverAllServicesAndCharacteristicsForDevice(btDevice.id);

    // Load services
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
                            console.error(error);
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


    return {
        id,
        name,
        services
    };
}