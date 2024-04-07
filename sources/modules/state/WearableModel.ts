import { AsyncLock } from "teslabot";
import { startBluetooth } from "../wearable/bt";
import { Jotai } from "./Jotai";
import { atom } from "jotai";

export class WearableModel {
    private lock = new AsyncLock();
    readonly jotai: Jotai;
    readonly status = atom<'loading' | 'ready' | 'denied' | 'unavailable'>('loading');

    constructor(jotai: Jotai) {
        this.jotai = jotai;
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
        });
    }
}