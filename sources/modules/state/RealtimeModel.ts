import { InvalidateSync } from "teslabot";
import { Jotai } from "./_types";
import { AppState } from "react-native";
import { createClient, LiveClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { BubbleClient } from "../api/client";
import { log } from "../../utils/logs";
import { backoff } from "../../utils/time";
import { atom, useAtomValue } from "jotai";

export class RealtimeModel {
    readonly jotai: Jotai;
    readonly client: BubbleClient;
    readonly #sync: InvalidateSync;
    readonly state = atom('');
    #buffer: { data: Uint8Array, format: 'mulaw-8' | 'mulaw-16' } | null = null;
    #client: LiveClient | null = null;
    #capturing = false;
    #transcripts: { speaker: number, transcript: string }[] = [];
    #pendingTranscript: { speaker: number, transcript: string }[] = [];

    constructor(client: BubbleClient, jotai: Jotai) {
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

    #flushUI = () => {
        let data = [...this.#transcripts];
        if (this.#transcripts.length > 0 && this.#pendingTranscript.length > 0) {
            if (this.#transcripts[data.length - 1].speaker === this.#pendingTranscript[0].speaker) {
                data[data.length - 1].transcript += ' ' + this.#pendingTranscript[0].transcript;
                data = [...data, ...this.#pendingTranscript.slice(1)];
            } else {
                data = [...data, ...this.#pendingTranscript];
            }
        } else {
            data = [...data, ...this.#pendingTranscript];
        }
        if (data.length > 3) { // Keep last 3
            data = data.slice(data.length - 3);
        }
        this.jotai.set(this.state, data.map((v) => 'Speaker ' + (v.speaker + 1) + ': ' + v.transcript).join("\n"));
    }

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
                this.#flushUI();
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
                diarize: true,
                encoding: 'mulaw',
                sample_rate: format === 'mulaw-8' ? 8000 : 16000,
                channels: 1,
            });

            this.#client.on(LiveTranscriptionEvents.Open, () => {
                log('DG', "connection established");
            });

            this.#client.on(LiveTranscriptionEvents.Close, () => {
                log('DG', "connection closed");
            });

            this.#client.on(LiveTranscriptionEvents.Transcript, (data) => {
                const isFinal = data.is_final as boolean;
                const words = data.channel.alternatives[0].words as { word: string, speaker: number }[];
                if (words.length === 0) {
                    this.#pendingTranscript = [];
                } else {
                    function appendWord(to: { transcript: string, speaker: number }[], word: string, speaker: number) {
                        if (to.length === 0) {
                            to.push({ transcript: word, speaker });
                        } else {
                            if (to[to.length - 1].speaker === speaker) {
                                to[to.length - 1].transcript += ' ' + word;
                            } else {
                                to.push({ transcript: word, speaker });
                            }
                        }
                    }
                    for (let w of words) {
                        if (isFinal) {
                            appendWord(this.#transcripts, w.word, w.speaker);
                        } else {
                            appendWord(this.#pendingTranscript, w.word, w.speaker);
                        }
                    }
                }
                this.#flushUI();
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