import { audioAndroidStartForegroundService, audioAndroidStopForegroundService } from "../../../modules/audio";
import { hasAppModel, loadAppModelIfNeeded } from "../../global";
import { log } from "../../utils/logs"
import { delay } from "../../utils/time";

export class BackgroundService {
    constructor() {

    }

    start = () => {
        log('BKG', 'Start background service');
        audioAndroidStartForegroundService({
            headlessTaskName: 'HeadlessAppTask',
            notificationTitle: 'Connected to device',
            notificationDesc: 'Listening for commands',
            notificationColor: '#FF0000',
            notificationId: 1 // Must not be zero
        });
        // setInterval(() => {
        //     console.log('Even loop');
        // }, 1000);
    }

    stop = () => {
        log('BKG', 'Stop background service');
        audioAndroidStopForegroundService();
    }
}

export async function HeadlessAppTask() {
    log('BKG', 'Headless task started');

    // Load the app if needed
    loadAppModelIfNeeded();
    if (!hasAppModel()) { // Exit if the app is not loaded
        log('BKG', 'Headless task exited: no app model loaded');
        return;
    }

    // Wait forever
    while (true) {
        await delay(1000);
        // log('BKG', 'Headless task tick');
    }
}