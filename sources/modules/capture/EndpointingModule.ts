import { VADModel } from "../ai/vad/model/model";
import { log } from "../../utils/logs";
import { SyncModel } from "./SyncModel";
import { WaveFile } from "wavefile";
import { compress } from "../../../modules/audio";
import { randomKey } from "../crypto/randomKey";
import { atom, useAtomValue } from "jotai";
import { Jotai } from "../state/_types";

export class EndpointingModule {

    readonly options = {
        positiveProb: 0.5,
        negativeProb: 0.5 - 0.15,
        minSpeechFrames: 3,

        preSpeechPadDuration: 5, // 5 seconds
        redemptionDuration: 1, // 5 seconds
        cooldownDuration: 60, // 60 seconds
        bufferTruncateDuration: 15, // 15 seconds NOTE: Must be greater preSpeechPadDuration, but bigger to avoid truncation on every frame
    };
    readonly sync: SyncModel;
    readonly jotai: Jotai;
    readonly state = atom<'idle' | 'voice'>('idle');

    #model: VADModel | null = null;
    #state: {
        buffer: Int16Array,
        processed: number,
        sr: number,
        start: number,
        vad: { from: number, redemption: number, voiceFrames: number, resumeVoiceFrames: number, end: number | null, cooldown: number } | null,
    } | null = null;

    constructor(sync: SyncModel, jotai: Jotai) {
        this.sync = sync;
        this.jotai = jotai;
    }

    use = () => {
        return useAtomValue(this.state);
    }

    onDeviceStreamStart = async (sr: 8000 | 16000) => {
        log('END', 'Endpointing session start @' + sr);
        this.#state = { buffer: new Int16Array(0), sr, start: Math.floor(Date.now() / 1000), processed: 0, vad: null };
        await this.#vadStart(sr);
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

        // Process
        await this.#processBuffer(false);
    }

    onDeviceStreamStop = async () => {
        log('END', 'Endpointing session stop');
        if (!this.#state) {
            throw new Error('No state'); // Should not happen
        }

        // Handle flush
        await this.#processBuffer(true);

        // Stop VAD
        await this.#vadStop();

        // Reset
        this.#state = null;
    }

    //
    // VAD implementation
    //

    #processBuffer = async (flush: boolean) => {

        // Handle on-the-fly endpointing
        const state = this.#state!;

        // 512, 1024, 1536 samples for 16000 sample rate and 256, 512, 768 samples for 8000 sample rate
        const vadFrameSize = state.sr === 8000 ? 768 : 1536;
        const redemptionFrames = Math.floor(this.options.redemptionDuration * state.sr / vadFrameSize);
        const cooldownFrames = Math.floor(this.options.cooldownDuration * state.sr / vadFrameSize);

        // Process frames
        while (state.buffer.length - state.processed >= vadFrameSize) {

            // Run VAD
            let voiceProb = await this.#vadPredict(state.buffer.slice(state.processed, state.processed + vadFrameSize));
            state.processed += vadFrameSize;

            // Handle non-active state
            if (state.vad === null) {

                // Check if we need to start
                if (voiceProb > this.options.positiveProb) {
                    state.vad = {
                        from: Math.max(state.processed - Math.floor(this.options.preSpeechPadDuration * state.sr), 0),
                        voiceFrames: 1,
                        redemption: 0,
                        end: null,
                        cooldown: 0,
                        resumeVoiceFrames: 0,
                    };
                    log('END', 'Voice detected');
                    this.jotai.set(this.state, 'voice');
                }

            } else {

                // If has voice - reset redemption and increment voice frames
                if (voiceProb > this.options.positiveProb) {
                    if (state.vad.end !== null) {
                        state.vad.resumeVoiceFrames++;
                        log('END', 'Voice resumed');
                        this.jotai.set(this.state, 'voice');
                    }
                    state.vad.voiceFrames++;
                    state.vad.redemption = 0;
                    state.vad.cooldown = 0;
                    state.vad.end = null;
                }

                // If has no voice - increment redemption
                if (voiceProb < this.options.negativeProb) {
                    state.vad.redemption++;
                }

                // Check if redepmtion is over
                if (state.vad.redemption > redemptionFrames && state.vad.end === null) {
                    state.vad.end = state.processed;
                    if (state.vad.voiceFrames < this.options.minSpeechFrames) {
                        state.vad = null;
                        log('END', 'Voice canceled');
                    } else {
                        log('END', 'Voice paused');
                    }
                    this.jotai.set(this.state, 'idle');
                }

                // Check if cooldown is over
                if (state.vad && state.vad.end !== null) {
                    state.vad.cooldown++;
                    if (state.vad.cooldown > cooldownFrames) {
                        log('END', 'Voice ended');
                        let buffer = state.buffer.slice(state.vad.from, state.vad.end);
                        await this.#flush(state.sr, buffer);
                        this.#advance(state.vad.end);
                        state.vad = null;
                    }
                }
            }
        }

        // Check flush
        if (flush && state.vad !== null) {
            let to = state.vad.end ?? state.buffer.length;
            let buffer = state.buffer.slice(state.vad.from, to);
            state.vad = null;
            await this.#flush(state.sr, buffer);
        }

        // Truncate buffer if it is too big
        if (!this.#state!.vad && this.#state!.buffer.length > this.options.bufferTruncateDuration * this.#state!.sr) {
            this.#advance(Math.floor(this.options.preSpeechPadDuration * this.#state!.sr));
        }
    }

    #advance = (offset: number) => {
        let state = this.#state!;
        let timeDelta = offset / state.sr;
        state.start += timeDelta;
        state.buffer = state.buffer.slice(offset);
        state.processed -= offset;
    }

    // TODO: Move this to worklet
    #flush = async (sr: number, frames: Int16Array) => {

        // Create wav
        let wav = new WaveFile();
        wav.fromScratch(1, sr, '16', frames);
        let output = wav.toBuffer();

        // Compress
        let compressed = await compress(output);

        // Report session
        let sessionId = randomKey();
        this.sync.syncNewSession(sessionId);
        this.sync.syncSessionFrame(sessionId, 0, compressed.format, compressed.data);
        this.sync.syncSessionEnded(sessionId);
    }

    //
    // VAD Methods
    //

    #getVad = async () => {
        if (this.#model) {
            return this.#model!;
        }
        this.#model = await VADModel.create();
        return this.#model!;
    }

    #vadStart = async (sr: 8000 | 16000) => {
        let vad = await this.#getVad();
        vad.start(sr);
    }

    #vadStop = async () => {
        let vad = await this.#getVad();
        vad.stop();
    }

    #vadPredict = async (buffer: Int16Array) => {
        let converted = new Float32Array(buffer.length);
        for (let i = 0; i < buffer.length; i++) {
            converted[i] = buffer[i] / 32768.0;
        }
        let vad = await this.#getVad();
        return await vad.process(converted);
    }
}