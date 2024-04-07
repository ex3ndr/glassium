import { delay } from "../../utils/time";
import { randomKey } from "../crypto/randomKey";
import { Packetizer } from "../streaming/Packetizer";
import { Uploader } from "../streaming/Uploader";
import { openDevice, startBluetooth } from "../wearable/bt";
import { BTDevice } from "../wearable/bt_common";
import { resolveProtocol } from "../wearable/protocol";
import { AppState } from "./AppState";

export class CaptureSession {
    readonly appState: AppState;
    state: 'starting' | 'online' | 'stoppping' | 'stopped' = 'starting';
    private readonly repeatKey = randomKey();

    constructor(appState: AppState) {
        this.appState = appState;
    }

    start = () => {
        (async () => {
            let session: string | null = null;
            let device: BTDevice | null = null;
            try {

                // Connecting to device
                let results = await startBluetooth();
                if (results !== 'started') {
                    return; // TODO: Toast
                }

                // Open device
                device = await openDevice({ name: 'Super' });
                if (device === null) {
                    return; // TODO: Toast
                }

                // Protocol
                let protocol = await resolveProtocol(device);
                if (protocol === null) {
                    return; // TODO: Toast
                }

                // Starting session
                session = await this.appState.client.startSession(this.repeatKey);
                if (this.state !== 'starting') {
                    return;
                }

                // Subscribe
                this.state = 'online';
                let uploader = new Uploader(this.appState.client, session);
                let packetizer = new Packetizer(this.appState.client, session, protocol.codec, 64, uploader);

                // Subscribe to protocol
                let cancel = protocol.source.subscribe((data) => {
                    if (this.state === 'online') {
                        packetizer.append(data);
                    }
                });

                // Await completion
                while (this.state === 'online') {
                    await delay(1000);
                }

                // Stopping session
                cancel();

                // Await upload completing
                await uploader.awaitCompletion();

                // Done
                this.state = 'stopped';
            } catch (e) {
                console.error(e);
            } finally {
                this.state = 'stopped';
                if (session !== null) {
                    await this.appState.client.stopSession(session);
                }
                if (device !== null) {
                    device.close();
                }
            }
        })();
    }

    stop = () => {

    }
}