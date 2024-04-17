import { InvalidateSync } from "teslabot";
import { Jotai } from "./_types";
import { AppState } from "react-native";
import { createClient, LiveClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { SuperClient } from "../api/client";
import { log } from "../../utils/logs";
import { backoff } from "../../utils/time";

export class RealtimeModel {
    readonly jotai: Jotai;
    readonly client: SuperClient;
    readonly #sync: InvalidateSync;
    #buffer: { data: Uint8Array, format: 'mulaw-8' | 'mulaw-16' } | null = null;
    #client: LiveClient | null = null;
    #capturing = false;

    constructor(client: SuperClient, jotai: Jotai) {
        this.jotai = jotai;
        this.client = client;
        this.#sync = new InvalidateSync(this.#doSync, { backoff });
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

    onCaptureFrame = (frame: Uint8Array, format: 'mulaw-8' | 'mulaw-16') => {

        // Ignore if not active
        if (AppState.currentState !== 'active' || !this.#capturing) {
            return;
        }

        // Discard if format changed
        if (this.#buffer && this.#buffer.format !== format) {
            this.#buffer = null;
        }

        // Append to buffer
        if (!this.#buffer) {
            this.#buffer = { data: frame, format };
        } else {
            let merged = new Uint8Array(this.#buffer.data.length + frame.length);
            merged.set(this.#buffer.data, 0);
            merged.set(frame, this.#buffer.data.length);
            this.#buffer = { data: merged, format };
        }
        this.#sync.invalidate();
    }

    #doSync = async () => {

        // Clear buffer if not active
        if (AppState.currentState !== 'active' || !this.#capturing) {
            this.#buffer = null;
            if (this.#client) {
                log('DG', "Closing connection");
                this.#client.finish();
                this.#client = null;
            }
            return;
        }

        // Read from buffer
        if (!this.#buffer) {
            return;
        }
        const format = this.#buffer.format
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
                model: "nova",
                interim_results: true,
                smart_format: true,
                encoding: 'mulaw',
                sample_rate: format === 'mulaw-8' ? 8000 : 16000,
                channels: 1,
            });

            this.#client.on(LiveTranscriptionEvents.Open, () => {
                console.log("connection established");
            });

            this.#client.on(LiveTranscriptionEvents.Close, () => {
                console.log("connection closed");
            });

            this.#client.on(LiveTranscriptionEvents.Transcript, (data) => {
                console.log(data.channel);
                console.log(data.channel.alternatives[0].words);
                const words = data.channel.alternatives[0].words;
                const caption = words
                    .map((word: any) => word.punctuated_word ?? word.word)
                    .join(" ");
                if (caption !== "") {
                    console.log(caption);
                }
            });

            log('DG', "Connection created");
        }

        // Push data to client
        log('DG', "Sending data " + buffer.length + " bytes");
        this.#client.send(buffer);
    };
}