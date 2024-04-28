import { BTDevice, BTDiscoveredDevice, BTService, BluetoothModelInterface, BluetoothStartResult } from "./types";

export class BluetoothModel implements BluetoothModelInterface {
    readonly isPersistent: boolean = false;
    readonly supportsScan: boolean = false;
    readonly supportsPick: boolean = true;

    #pickedDevices = new Map<string, BluetoothDevice>();

    constructor() {
        // Nothing to do
    }

    async start(): Promise<BluetoothStartResult> {
        let available = await navigator.bluetooth.getAvailability();
        if (available) {
            return 'started';
        } else {
            return 'failure';
        }
    }

    startScan(handler: (device: BTDiscoveredDevice) => void): void {
        throw new Error('Not supported');
    }

    stopScan(): void {
        throw new Error('Not supported');
    }

    async pick(services: string[]): Promise<BTDiscoveredDevice | null> {
        let device: BluetoothDevice;
        try {
            device = await navigator.bluetooth.requestDevice({
                optionalServices: services,
                acceptAllDevices: true
            });
        } catch (e) {
            return null;
        }
        if (!device.name) {
            return null;
        }
        if (device) {
            this.#pickedDevices.set(device.id, device);
            return { id: device.id, name: device.name, services: [] };
        } else {
            return null;
        }
    }

    async connect(id: string): Promise<BTDevice | null> {

        // Find picked device
        const dev = this.#pickedDevices.get(id);
        if (!dev || !dev.gatt) {
            return null;
        }

        // Extract device
        let name = dev.name || 'Unknown';
        let services: BTService[] = [];

        // Connect to gatt
        let gatt = await dev.gatt!.connect();
        let btservices = await gatt.getPrimaryServices();
        for (let s of btservices) {
            let ch = await s.getCharacteristics();
            let subsciptionsCount = 0;
            let characteristics = ch.map(c => {
                return {
                    id: c.uuid,
                    canRead: c.properties.read,
                    canWrite: c.properties.write,
                    canNotify: c.properties.notify,
                    read: async () => {
                        let value = await c.readValue();
                        return new Uint8Array(value.buffer);
                    },
                    write: async (data: Uint8Array) => {
                        await c.writeValue(data);
                    },
                    subscribe: (callback: (data: Uint8Array) => void) => {
                        c.addEventListener('characteristicvaluechanged', (e) => {
                            let value = (e.target as BluetoothRemoteGATTCharacteristic).value!;
                            callback(new Uint8Array(value.buffer));
                        });
                        if (subsciptionsCount === 0) {
                            c.startNotifications();
                        }
                        subsciptionsCount++;
                        let exited = false;
                        return () => {
                            if (exited) {
                                return;
                            }
                            exited = true;
                            c.removeEventListener('characteristicvaluechanged', () => { });
                            subsciptionsCount--;
                            if (subsciptionsCount === 0) {
                                c.stopNotifications();
                            }
                        };
                    }
                };
            });
            services.push({
                id: s.uuid,
                characteristics
            });
        }

        // Connected state (what about race conditions here?)
        let connected = gatt.connected;
        let callbacks = new Set<() => void>();
        if (connected) {
            let handler = () => {
                // Remove subscription
                gatt.device.removeEventListener('gattserverdisconnected', handler);

                // Update state
                connected = false;

                // Notify
                for (let cb of callbacks) {
                    cb();
                }
            };
            gatt.device.addEventListener('gattserverdisconnected', handler);
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
                await dev.forget();
            }
        };
    }
}