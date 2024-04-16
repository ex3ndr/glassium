import { AsyncLock, InvalidateSync } from "teslabot";
import { BTDevice } from "../wearable/bt_common";
import { connectToDevice } from "../wearable/bt";
import { log } from "../../utils/logs";
import { Jotai } from "./_types";
import { atom } from "jotai";
import { ProtocolDefinition, resolveProtocol } from "../wearable/protocol";
import { backoff } from "../../utils/time";

export class DeviceModel {
    static #lock = new AsyncLock(); // Use static lock to prevent multiple BT operations

    readonly id: string;
    readonly #sync: InvalidateSync;
    readonly jotai: Jotai;
    readonly state = atom<{ status: 'disconnected' | 'connecting' } | { status: 'connected' | 'subscribed', battery: number | null }>({ status: 'connecting' });
    onStreamingStart?: (protocol: ProtocolDefinition) => void;
    onStreamingStop?: () => void;
    onStreamingFrame?: (data: Uint8Array) => void;
    #needStop = false;
    #needStreaming = false;
    #device: BTDevice | null = null;
    #deviceReady = false;
    #deviceStreaming: { ptocol: ProtocolDefinition, subscription: () => void } | null = null;
    #deviceBattery: number | null = null;
    #deviceBatterySubscription: (() => void) | null = null;

    constructor(id: string | BTDevice, jotai: Jotai, needStreaming = false) {
        this.#needStreaming = needStreaming;
        if (typeof id === 'object') {
            this.#device = id;
            this.id = id.id;
        } else {
            this.id = id;
        }
        this.jotai = jotai;
        this.#sync = new InvalidateSync(this.#update, { backoff });
    }

    init = () => {
        this.#sync.invalidate();
    }

    #flushUI = () => {
        if (this.#device) {
            if (this.#deviceReady) {
                if (this.#deviceStreaming) {
                    this.jotai.set(this.state, { status: 'subscribed', battery: this.#deviceBattery });
                } else {
                    this.jotai.set(this.state, { status: 'connected', battery: this.#deviceBattery });
                }
            } else {
                this.jotai.set(this.state, { status: 'connecting' });
            }
        } else if (this.#needStop) {
            this.jotai.set(this.state, { status: 'disconnected' });
        } else {
            this.jotai.set(this.state, { status: 'connecting' });
        }
        // if (this.#device.connected) {
        //     this.jotai.set(this.state, { status: 'connected', battery: null });
        // } else {
        //     this.jotai.set(this.state, { status: 'connecting' });
        // }
    }

    #cleanupDevice = () => {

        // Device is disconnected
        this.#device = null;
        this.#deviceBattery = null;

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
    }

    #update = async () => {
        await DeviceModel.#lock.inLock(async () => { // Run in lock to prevent multiple BT operations and race conditions
            log('BT', 'DeviceModel#update');

            // Detect disconnect
            if (this.#device && (!this.#device.connected || this.#needStop)) {

                // Remove all subscriptions
                this.#cleanupDevice();

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
                let dev = await connectToDevice(this.id);
                if (!dev) {
                    throw new Error('Device not found'); // Backoff retry
                }
                this.#device = dev;
                dev.onDisconnected(() => { log('BT', 'Device disconnected notification'); this.#sync.invalidate(); });
                log('BT', 'Device connected');
                // this.#flushUI(); NOTE: We are not flushing on disconnect and wait for the auxlulary services to load
            }

            // Handling battery state
            let batteryLoaded = !!this.#deviceBatterySubscription;
            if (!batteryLoaded) {
                let batteryService = this.#device.services.find((v) => v.id === '0000180f-0000-1000-8000-00805f9b34fb');
                if (batteryService) {
                    let batteryChar = batteryService.characteristics.find((v) => v.id === '00002a19-0000-1000-8000-00805f9b34fb' && v.canRead && v.canNotify);
                    if (batteryChar) {
                        let percent = (await batteryChar.read())[0];
                        log('BT', 'Battery:' + percent);
                        this.#deviceBattery = percent;
                        this.#deviceBatterySubscription = batteryChar.subscribe(async (data) => {
                            log('BT', 'Battery:' + data[0]);
                            this.#deviceBattery = data[0];
                            this.#flushUI();
                        });
                    } else {
                        batteryLoaded = true;
                    }
                } else {
                    batteryLoaded = true;
                }
            }

            // Flush UI if we became ready
            if (!this.#deviceReady && batteryLoaded) {
                this.#flushUI();
                this.#deviceReady = true;
            }

            // Handling streaming start
            if (this.#needStreaming && !this.#deviceStreaming) {
                log('BT', 'Need streaming: subscribing');

                // Resolve protocol
                const protocol = await resolveProtocol(this.#device);
                if (!protocol) {
                    log('BT', 'Protocol not found');
                    throw new Error('Protocol not found'); // Should not happen
                }

                // Subscribe
                let sub = protocol.source.subscribe((data) => {
                    if (this.onStreamingFrame && !this.#needStop) {
                        this.onStreamingFrame(data);
                    }
                });

                // Save subscription
                this.#deviceStreaming = { ptocol: protocol, subscription: sub };
                if (this.onStreamingStart && !this.#needStop) { // NOTE: No scheduling here to avoid race conditions
                    this.onStreamingStart(protocol);
                }

                // Update state
                this.#flushUI();
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
        if (!this.#needStop) {
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