import { Jotai } from "./_types";
import { AppState } from "react-native";
import { createClient, LiveClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { BackendClient } from "../api/client";
import { log } from "../../utils/logs";
import { atom, useAtomValue } from "jotai";
import { InvalidateSync } from "../../utils/sync";

export class RealtimeModel {
    readonly jotai: Jotai;
    readonly client: BackendClient;
    readonly #sync: InvalidateSync;
    readonly state = atom('');
    #buffer: { data: Int16Array, sr: number } | null = null;
    #client: LiveClient | null = null;
    #capturing = false;
    #transcripts: { speaker: number, transcript: string }[] = [];
    #pendingTranscript: { speaker: number, transcript: string }[] = [];

    constructor(client: BackendClient, jotai: Jotai) {
        this.jotai = jotai;
        this.client = client;
        this.#sync = new InvalidateSync(this.#doSync);
        this.#sync.invalidate();
        AppState.addEventListener('change', () => this.#sync.invalidate());
    }

    onCaptureStart = () => {
        this.#capturing = true;
        this.#sync.invalidate();
    }

    onCaptureStop = () => {
        this.#capturing = false;
        this.#sync.invalidate();
    }

    onCaptureFrame = (frame: Int16Array, sr: number) => {

        // Ignore if not active
        if (AppState.currentState !== 'active' || !this.#capturing) {
            return;
        }

        // Discard if format changed
        if (this.#buffer && this.#buffer.sr !== sr) {
            this.#buffer = null;
        }

        // Append to buffer
        if (!this.#buffer) {
            this.#buffer = { data: frame, sr };
        } else {
            let merged = new Int16Array(this.#buffer.data.length + frame.length);
            merged.set(this.#buffer.data, 0);
            merged.set(frame, this.#buffer.data.length);
            this.#buffer = { data: merged, sr };
        }
        this.#sync.invalidate();
    }

    // #flushUI = () => {
    //     let data = [...this.#transcripts];
    //     if (this.#transcripts.length > 0 && this.#pendingTranscript.length > 0) {
    //         if (this.#transcripts[data.length - 1].speaker === this.#pendingTranscript[0].speaker) {
    //             data[data.length - 1].transcript += ' ' + this.#pendingTranscript[0].transcript;
    //             data = [...data, ...this.#pendingTranscript.slice(1)];
    //         } else {
    //             data = [...data, ...this.#pendingTranscript];
    //         }
    //     } else {
    //         data = [...data, ...this.#pendingTranscript];
    //     }
    //     if (data.length > 3) { // Keep last 3
    //         data = data.slice(data.length - 3);
    //     }
    //     this.jotai.set(this.state, data.map((v) => 'Speaker ' + (v.speaker + 1) + ': ' + v.transcript).join("\n"));
    // }

    #doSync = async () => {

        // Clear buffer if not active
        if (AppState.currentState !== 'active' || !this.#capturing) {
            this.#buffer = null;
            if (this.#client) {
                log('DG', "Closing connection");
                this.#client.finish();
                this.#client = null;
                this.#transcripts = [];
                this.#pendingTranscript = [];
                this.jotai.set(this.state, '');
            }
            return;
        }

        // Read from buffer
        if (!this.#buffer) {
            return;
        }
        const sr = this.#buffer.sr
        const buffer = this.#buffer.data.slice();
        this.#buffer = null;

        // Create a deepgram client if needed
        if (!this.#client) {

            log('DG', "Creating connection");

            // Fetch API key
            let token = await this.client.getDeepgramToken();

            // Create client
            const client = createClient(token);

            // Create live client
            this.#client = client.listen.live({
                model: "nova-2",
                encoding: 'linear16',
                sample_rate: sr,
                channels: 1,
            });

            this.#client.on(LiveTranscriptionEvents.Open, () => {
                log('DG', "connection established");
            });

            this.#client.on(LiveTranscriptionEvents.Close, (e) => {
                console.warn(e);
                log('DG', "connection closed");
            });

            this.#client.on(LiveTranscriptionEvents.Transcript, (data) => {
                this.jotai.set(this.state, data.channel.alternatives[0].transcript);
            });

            log('DG', "Connection created");
        }

        // Push data to client
        this.#client.send(buffer);
    };

    use() {
        return useAtomValue(this.state);
    }
}