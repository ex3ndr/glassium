import { AsyncLock } from "teslabot";
import { connectToDevice, startBluetooth } from "../wearable/bt";
import { Jotai } from "./Jotai";
import { atom, useAtomValue } from "jotai";
import { storage } from "../../storage";
import { delay } from "../../utils/time";
import { BTDevice } from "../wearable/bt_common";

export class WearableModel {
    private lock = new AsyncLock();
    readonly jotai: Jotai;
    readonly status = atom<'loading' | 'connecting' | 'need-pairing' | 'ready' | 'denied' | 'unavailable'>('loading');
    private _deviceId: string | null = null;
    private _device: BTDevice | null = null;

    constructor(jotai: Jotai) {
        this.jotai = jotai;
        let id = storage.getString('wearable-device');
        if (id) {
            this._deviceId = id;
        }
    }

    get device() {
        return this._device;
    }

    start() {
        this.lock.inLock(async () => {

            // Starting bluetooth
            let result = await startBluetooth();
            if (result === 'denied') {
                this.jotai.set(this.status, 'denied');
                return;
            } else if (result === 'failure') {
                this.jotai.set(this.status, 'unavailable');
                return;
            }

            // Not paired
            if (!this._deviceId) {
                this.jotai.set(this.status, 'need-pairing');
                return;
            }

            // Do connecting
            this.jotai.set(this.status, 'connecting');

            // Connect
            let device: BTDevice;
            while (true) {
                const connected = await connectToDevice(this._deviceId);
                if (!connected) {
                    await delay(1000);
                    continue;
                }
                device = connected;
                break;
            }
            this._device = device;

            // Connected
            this.jotai.set(this.status, 'ready');
        });
    }

    use() {
        return { status: useAtomValue(this.status) };
    }
}