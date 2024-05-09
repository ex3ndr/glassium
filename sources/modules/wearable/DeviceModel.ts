import { log } from "../../utils/logs";
import { Jotai } from "../services/_types";
import { atom } from "jotai";
import { ProtocolDefinition, resolveProtocol } from "./protocol/protocol";
import { BTDevice } from "./bluetooth/types";
import { BluetoothModel } from "./bluetooth/bt";
import { bluetoothServices } from "./protocol/services";
import { uptime } from "../../utils/uptime";
import { track } from "../track/track";
import { InvalidateSync } from "../../utils/sync";
import { AsyncLock } from "../../utils/lock";
import { run } from "../../utils/run";
import { backoff, delay } from "../../utils/time";
import { convertCompassVoltage } from "./protocol/compass";

export class DeviceModel {
    static #lock = new AsyncLock(); // Use static lock to prevent multiple BT operations

    readonly id: string;
    readonly #sync: InvalidateSync;
    readonly jotai: Jotai;
    readonly bluetooth: BluetoothModel;
    readonly state = atom<{ status: 'disconnected' | 'connecting' } | { status: 'connected' | 'subscribed', battery: number | null, muted: boolean }>({ status: 'connecting' });
    onStreamingStart?: (protocol: ProtocolDefinition, muted: boolean) => void;
    onStreamingMute?: (muted: boolean) => void;
    onStreamingFrame?: (data: Uint8Array) => void;
    onStreamingStop?: () => void;
    #needStop = false;
    #needStreaming = false;
    #device: BTDevice | null = null;
    #deviceReady = false;
    #deviceStreaming: { ptocol: ProtocolDefinition, subscription: () => void } | null = null;
    #deviceBattery: number | null = null;
    #deviceBatterySubscription: (() => void) | null = null;
    #deviceMuted: boolean | null = null;
    #deviceMutedSubscription: (() => void) | null = null;

    constructor(id: string | BTDevice, jotai: Jotai, bluetooth: BluetoothModel, needStreaming = false) {
        this.#needStreaming = needStreaming;
        this.bluetooth = bluetooth;
        if (typeof id === 'object') {
            this.#device = id;
            this.id = id.id;
        } else {
            this.id = id;
        }
        this.jotai = jotai;
        this.#sync = new InvalidateSync(this.#update);
    }

    init = () => {
        this.#sync.invalidate();
    }

    #flushUI = () => {
        if (this.#device) {
            if (this.#deviceReady) {
                if (this.#deviceStreaming) {
                    this.jotai.set(this.state, { status: 'subscribed', battery: this.#deviceBattery, muted: !(this.#deviceMuted !== true) });
                } else {
                    this.jotai.set(this.state, { status: 'connected', battery: this.#deviceBattery, muted: !(this.#deviceMuted !== true) });
                }
            } else {
                this.jotai.set(this.state, { status: 'connecting' });
            }
        } else if (this.#needStop) {
            this.jotai.set(this.state, { status: 'disconnected' });
        } else {
            this.jotai.set(this.state, { status: 'connecting' });
        }
    }

    #cleanupDevice = async () => {

        // Device is disconnected
        await this.#device?.disconnect();
        this.#device = null;
        this.#deviceBattery = null;
        this.#deviceMuted = null;
        this.#deviceReady = false;

        // Cleanup subscriptions
        if (this.#deviceStreaming) {
            this.#deviceStreaming.subscription(); // Unsubscribe
            this.#deviceStreaming = null; // Reset streaming
            if (this.onStreamingStop && !this.#needStop) {
                this.onStreamingStop();
            }
        }
        if (this.#deviceBatterySubscription) {
            this.#deviceBatterySubscription();
            this.#deviceBatterySubscription = null;
        }
        if (this.#deviceMutedSubscription) {
            this.#deviceMutedSubscription();
            this.#deviceMutedSubscription = null;
        }
    }

    #update = async () => {
        await DeviceModel.#lock.inLock(async () => { // Run in lock to prevent multiple BT operations and race conditions
            log('BT', 'DeviceModel#update');

            // Detect disconnect
            if (this.#device && (!this.#device.connected || this.#needStop)) {

                // Remove all subscriptions
                await this.#cleanupDevice();

                // Update UI
                this.#flushUI();
            }

            // Do nothing if we need to stop
            if (this.#needStop) {
                return;
            }

            // Connect to device
            if (!this.#device) {
                log('BT', 'Device is not connected: connecting');
                let dev = await this.bluetooth.connect(this.id);
                if (!dev) {
                    throw new Error('Device not found'); // Backoff retry
                }
                this.#device = dev;
                dev.onDisconnected(() => { log('BT', 'Device disconnected notification'); this.#sync.invalidate(); });
                // this.#flushUI(); NOTE: We are not flushing on disconnect and wait for the auxlulary services to load
            }

            // Handling battery state
            if (!this.#deviceReady && !this.#deviceBatterySubscription) {

                // Official battery service
                let batteryService = this.#device.services.find((v) => v.id === bluetoothServices.battery);
                if (batteryService) {
                    let batteryChar = batteryService.characteristics.find((v) => v.id === '00002a19-0000-1000-8000-00805f9b34fb' && v.canRead);
                    if (batteryChar) {

                        // Subscribe
                        let received = false;
                        let canNotify = batteryChar.canNotify;

                        // Subscribe
                        if (canNotify) {
                            this.#deviceBatterySubscription = batteryChar.subscribe(async (data) => {
                                log('BT', 'Battery:' + data[0]);
                                this.#deviceBattery = data[0];
                                received = true;
                                this.#flushUI();
                            });
                        } else {
                            log('BT', 'Battery: notify not supported');

                            // Run polling
                            let stop = false;
                            this.#deviceBatterySubscription = () => {
                                stop = true;
                            }
                            backoff(async () => {
                                while (!stop) {
                                    let percent = (await batteryChar.read())[0];
                                    if (!received) {
                                        this.#deviceBattery = percent;
                                        log('BT', 'Battery:' + percent);
                                    }
                                    await delay(15000);
                                }
                            });
                        }

                        // Read initial value
                        let percent = (await batteryChar.read())[0];
                        if (!received) {
                            this.#deviceBattery = percent;
                            log('BT', 'Battery:' + percent);
                        }
                    }
                }

                // Compass battery service
                batteryService = this.#device.services.find((v) => v.id === bluetoothServices.compass);
                if (batteryService) {
                    let batteryChar = batteryService.characteristics.find((v) => v.id === '9f83442c-7da2-49ca-94e3-b06201a58508' && v.canRead);
                    if (batteryChar) {

                        // Subscribe
                        let received = false;
                        let canNotify = batteryChar.canNotify;

                        // For old firmware notify is not supported
                        if (batteryService.characteristics.find((v) => v.id === 'beb5483e-36e1-4688-b7f5-ea07361b26a8')) { // This is audio characteristic that exists only in V1 firmware
                            canNotify = false;
                        }

                        // Subscribe
                        if (canNotify) {
                            this.#deviceBatterySubscription = batteryChar.subscribe(async (data) => {
                                let value = convertCompassVoltage(new DataView(data.buffer).getUint32(0, false));
                                log('BT', 'Battery:' + value);
                                this.#deviceBattery = value;
                                received = true;
                                this.#flushUI();
                            });
                        } else {
                            log('BT', 'Battery: notify not supported');

                            // Run polling
                            let stop = false;
                            this.#deviceBatterySubscription = () => {
                                stop = true;
                            }
                            backoff(async () => {
                                while (!stop) {
                                    let value = convertCompassVoltage(new DataView((await batteryChar.read()).buffer).getUint32(0, false));
                                    this.#deviceBattery = value;
                                    log('BT', 'Battery:' + value);
                                    received = true;
                                    await delay(15000);
                                }
                            });
                        }

                        // Read initial value
                        let percent = convertCompassVoltage(new DataView((await batteryChar.read()).buffer).getUint32(0, false));
                        if (!received) {
                            this.#deviceBattery = percent;
                            log('BT', 'Battery:' + percent);
                        }
                    }
                }
            }

            // Handling mute state
            if (!this.#deviceReady && !this.#deviceMutedSubscription) {
                let muteService = this.#device.services.find((v) => v.id === bluetoothServices.super);
                if (muteService) {
                    let muteChar = muteService.characteristics.find((v) => v.id === '19b10003-e8f2-537e-4f6c-d104768a1214' && v.canRead && v.canNotify);
                    if (muteChar) {

                        // Subscribe
                        let received = false;
                        this.#deviceMutedSubscription = muteChar.subscribe(async (data) => {
                            log('BT', 'Muted:' + (data[0] === 0));
                            this.#deviceMuted = data[0] === 0;
                            received = true;
                            this.#flushUI();
                            if (this.#deviceStreaming && this.onStreamingMute && !this.#needStop) {
                                this.onStreamingMute(data[0] === 0);
                            }
                        });

                        // Read initial value
                        let muted = (await muteChar.read())[0] === 0;
                        if (!received) {
                            this.#deviceMuted = muted;
                            log('BT', 'Muted:' + muted);
                        }
                    }
                }
            }

            // Flush UI if we became ready
            if (!this.#deviceReady) {
                this.#deviceReady = true;
                this.#flushUI();
            }

            // Handling streaming start
            if (this.#needStreaming && !this.#deviceStreaming) {
                log('BT', 'Need streaming: subscribing');

                // Resolve protocol
                let start = uptime();
                const protocol = await resolveProtocol(this.#device);
                if (!protocol) {
                    log('BT', 'Protocol not found');
                    throw new Error('Protocol not found'); // Should not happen
                }
                let elapsed = uptime() - start;
                log('BT', 'Protocol resolved in ' + elapsed + 'ms');
                track('device_connected', { elapsed });

                // Subscribe
                let started = false;
                let sub = protocol.source.subscribe((data) => {
                    if (!started) {
                        started = true;
                        log('BT', 'Streaming started');
                    }
                    if (this.onStreamingFrame && !this.#needStop) {
                        this.onStreamingFrame(data);
                    }
                });

                // Save subscription
                this.#deviceStreaming = { ptocol: protocol, subscription: sub };
                if (this.onStreamingStart && !this.#needStop) { // NOTE: No scheduling here to avoid race conditions
                    this.onStreamingStart(protocol, this.#deviceMuted === true);
                }

                // Update state
                this.#flushUI();

                log('BT', 'Need streaming: subscribed');
            }

            // Handle streaming stop
            if (!this.#needStreaming && this.#deviceStreaming) {
                log('BT', 'No need streaming: unsubscribing');
                if (this.#deviceStreaming) {
                    this.#deviceStreaming.subscription(); // Unsubscribe
                    this.#deviceStreaming = null; // Reset streaming
                    if (this.onStreamingStop && !this.#needStop) { // NOTE: No scheduling here to avoid race conditions
                        this.onStreamingStop();
                    }
                }

                // Update state
                this.#flushUI();
            }
        });
    }

    startStreaming = () => {
        this.#needStreaming = true;
        this.#sync.invalidate();
    }

    stopStreaming = () => {
        this.#needStreaming = false;
        this.#sync.invalidate();
    }

    stop = () => {

        // Update state
        if (this.#needStop) {
            return;
        }
        this.#needStop = true;

        // Call streaming callback immediately
        if (this.#deviceStreaming && this.onStreamingStop) {
            this.onStreamingStop();
        }

        // Update UI
        this.#flushUI();

        // Disconnect device
        this.#sync.invalidate();
    }
}