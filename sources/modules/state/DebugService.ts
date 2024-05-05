import * as fs from 'expo-file-system';
import { storage } from "../../storage";
import { AsyncLock } from "../../utils/lock";
import { log, setLogHandler } from "../../utils/logs";
import { uptime } from "../../utils/uptime";
import { ProtocolDefinition } from "../wearable/protocol/protocol";
import { Jotai } from "./_types";
import { atom } from 'jotai';
import { fromByteArray } from 'react-native-quick-base64';
import { zip } from 'react-native-zip-archive'
import { format } from 'date-fns';
import { framesToWav } from '../media/framesToWav';
import { randomId } from '../crypto/randomId';

function timeBasedId() {
    return format(new Date().getTime(), 'yyyyMMddHHmm') + '_' + randomId(4);
}

export class DebugService {

    jotai: Jotai;
    sessions = atom<{ id: string, startedAt: number }[]>([]);
    enabled = atom(false);
    #sessionsList: { id: string, startedAt: number }[] = [];

    #started = false;
    #lock = new AsyncLock();

    // Session metadata
    #startedAtUptime = uptime();
    #startedAt = 0;
    #sessionId = timeBasedId();

    // Device metadata
    #lastSR: 8000 | 16000 | null = null;
    #lastProtocol: ProtocolDefinition | null = null;
    #deviceCaptureId = timeBasedId();

    // Session logs
    #logs: string = '';
    #captured: string[] = [];

    // Audio
    #frames: Int16Array[] = [];
    #framesCount = 0;

    constructor(jotai: Jotai) {
        this.jotai = jotai;
        let ex = storage.getString("debug-index");
        try {
            if (ex) {
                this.#sessionsList = JSON.parse(ex);
                jotai.set(this.sessions, this.#sessionsList);
            }
        } catch (e) {

        }

        // Register log
        setLogHandler((line) => {
            if (this.enabled) {
                this.#log(line);
            }
        });
    }

    doStartDebug = async () => {
        if (this.#started) {
            return;
        }

        log("DBG", "doStartDebug");
        this.#started = true;
        await this.#lock.inLock(async () => {
            await this.#startSession();
        });
        this.jotai.set(this.enabled, true);
    }

    doFlushDebug = async () => {
        if (!this.#started) {
            return;
        }
        log("DBG", "doFlushDebug");

        await this.#lock.inLock(async () => {

            // Flush session 
            await this.#flush();

            // Restart session
            await this.#startSession();
        });
    }

    doStopDebug = async () => {
        if (!this.#started) {
            return;
        }
        log("DBG", "doStopDebug");

        this.#started = false;
        await this.#lock.inLock(async () => {

            // Flush session
            await this.#flush();

            // Stop session
            await this.#resetSession();
        });
        this.jotai.set(this.enabled, false);
    }

    //
    // Mute controls
    //

    onLocalMute = (muted: boolean) => {
        this.#lock.inLock(async () => {
            if (!this.#started) {
                return;
            }
        });
    }

    onRemoteMute = (muted: boolean) => {
        this.#lock.inLock(async () => {
            if (!this.#started) {
                return;
            }
        });
    }

    //
    // Capture events
    //

    onCaptureStart = (sr: 8000 | 16000) => {
        this.#lock.inLock(async () => {
            this.#lastSR = sr;
            if (!this.#started) {
                return;
            }

            this.#log(`Capture started at ${sr}Hz`);
        });
    }

    onCaptureFrame = (frames: Int16Array) => {
        this.#lock.inLock(async () => {
            if (!this.#started) {
                return;
            }

            // Append frame
            this.#frames.push(frames);
            this.#framesCount += frames.length;

            // Auto-flush after 5 minutes
            if (this.#framesCount > 5 * 60 * this.#lastSR!) {
                await this.#flushCapture();
            }
        });
    }

    onCaptureStop = () => {
        this.#lock.inLock(async () => {
            if (!this.#started) {
                return;
            }

            this.#log(`Capture stopped`);
        });
    }

    //
    // Device events
    //

    onDeviceConnected = (protocol: ProtocolDefinition) => {
        this.#lock.inLock(async () => {
            this.#lastProtocol = protocol;
            if (!this.#started) {
                return;
            }
            this.#log(`Device connected with protocol ${protocol.kind}@${protocol.codec}`);
        });
    }

    onDeviceDisconnected = () => {
        this.#lock.inLock(async () => {
            this.#lastProtocol = null;
            this.#lastSR = null;
            if (!this.#started) {
                return;
            }
            this.#log(`Device disconnected`);
        });
    }

    //
    // Implementation
    //

    #startSession = async () => {

        // Reset session metadata
        await this.#resetSession();

        // Append session start log
        this.#log(`Session started at ${this.#startedAt}, uptime: ${this.#startedAtUptime}`);
        this.#log(`Session ID: ${this.#sessionId}`);
        if (this.#lastProtocol) {
            this.#log(`Device was connected, with protocol ${this.#lastProtocol.kind}@${this.#lastProtocol.codec}`);
        }
        if (this.#lastSR) {
            this.#log(`Capture was started at ${this.#lastSR}Hz`);
        }
    }

    #resetSession = async () => {

        // Reset session metadata
        this.#startedAtUptime = uptime();
        this.#startedAt = Date.now();
        this.#sessionId = timeBasedId();
        this.#logs = '';
        this.#frames = [];
        this.#framesCount = 0;
        this.#captured = [];
    }

    #flushCapture = async () => {

        // Flush frames
        if (this.#frames.length > 0) {
            let start = uptime();

            // Persist audio
            let wav = await framesToWav(this.#lastSR!, this.#frames);

            // Persist
            let path = `${this.#sessionId}/${this.#deviceCaptureId}.wav`;
            let enc = fromByteArray(wav);
            await fs.makeDirectoryAsync(fs.documentDirectory + this.#sessionId, { intermediates: true });
            await fs.writeAsStringAsync(fs.documentDirectory + path, enc, { encoding: fs.EncodingType.Base64 });

            // Persist to log
            this.#log(`Capture saved to ${path}`);
            this.#captured.push(this.#deviceCaptureId);

            log("DBG", `Flushed capture in ${uptime() - start}ms`);
        }

        // Reset capture state
        this.#deviceCaptureId = timeBasedId();
        this.#frames = [];
        this.#framesCount = 0;
    }

    #flush = async () => {

        // Flush capture buffer
        await this.#flushCapture();

        // Persist logs
        let start = uptime();
        await fs.makeDirectoryAsync(fs.documentDirectory + this.#sessionId, { intermediates: true });
        await fs.writeAsStringAsync(fs.documentDirectory + `${this.#sessionId}/log.txt`, this.#logs, { encoding: fs.EncodingType.UTF8 });
        log("DBG", `Flushed logs in ${uptime() - start}ms`);

        // Compress everything
        start = uptime();
        let files = [`${fs.documentDirectory}${this.#sessionId}/log.txt`, ...this.#captured.map(id => `${fs.documentDirectory}${this.#sessionId}/${id}.wav`)];
        await zip(files, `${fs.documentDirectory}${this.#sessionId}.zip`);
        log("DBG", `Compressed in ${uptime() - start}ms`);

        // Persist index
        this.#sessionsList = [...this.#sessionsList, {
            id: this.#sessionId,
            startedAt: this.#startedAt
        }]
        storage.set("debug-index", JSON.stringify(this.#sessionsList));

        // Update UI
        this.jotai.set(this.sessions, this.#sessionsList);
    }

    #log(message: string) {
        let timestamp = Math.floor((uptime() - this.#startedAtUptime) / 1000);
        let line = `${timestamp.toString().padStart(8, '0')}| ${message}`;
        if (this.#logs.length > 0) {
            this.#logs += `\n${line}`;
        } else {
            this.#logs = line;
        }
    }
}