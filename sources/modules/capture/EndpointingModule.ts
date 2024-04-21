import { VADModel } from "../ai/vad/model/model";
import { log } from "../../utils/logs";
import { SyncModel } from "./SyncModel";

export class EndpointingModule {

    readonly sync: SyncModel;
    #model: VADModel | null = null;
    #state: { buffer: Int16Array, sr: number, start: number } | null = null;

    constructor(sync: SyncModel) {
        this.sync = sync;
    }

    onDeviceStreamStart = async (sr: number) => {
        log('END', 'Endpointing session start @' + sr);
        this.#state = { buffer: new Int16Array(0), sr, start: Math.floor(Date.now() / 1000) };
    }

    onDeviceFrame = async (frames: Int16Array) => {
        // log('END', 'Device frame received');
        if (!this.#state) {
            throw new Error('No state'); // Should not happen
        }

        // Append
        let buffer = new Int16Array(this.#state.buffer.length + frames.length);
        buffer.set(this.#state.buffer);
        buffer.set(frames, this.#state.buffer.length);
        this.#state.buffer = buffer;
    }

    onDeviceStreamStop = async () => {
        log('END', 'Endpointing session stop');

        // Handle flush
        if (this.#state && this.#state.buffer.length > 5 * this.#state.sr /* > 5 sec */) {
            log('END', 'Endpointing session successful');
        } else {
            log('END', 'Endpointing session failed');
        }

        // Reset
        this.#state = null;
    }
}