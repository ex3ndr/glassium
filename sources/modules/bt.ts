import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, State, Subscription } from 'react-native-ble-plx';
import { BTDevice, BTStartResult } from './bt_common';

let _manager: BleManager | null = null;
function manager() {
    if (_manager === null) {
        _manager = new BleManager();
    }
    return _manager;
}

export async function startBluetooth(): Promise<BTStartResult> {

    let m = manager()
    return new Promise<BTStartResult>((resolve, reject) => {

        // Helpers
        let subscription: Subscription | null = null;
        let ended = false;
        function complete(result: BTStartResult) {
            if (!ended) {
                ended = true;
                if (subscription !== null) {
                    subscription.remove();
                    subscription = null;
                }
                resolve(result);
            }
        }

        // Subscribe
        subscription = m.onStateChange(state => {
            if (state === State.PoweredOn) {
                complete('started');
            } else if (state === State.Unknown || state === State.Unsupported) {
                complete('failure');
            } else if (state === State.Unauthorized) {
                complete('denied');
            } else if (state === State.PoweredOff) {
                // Ignore
            } else if (state === State.Resetting) {
                // Ignore
            }
        });

        // Check initial
        (async () => {
            let state = await m.state();
            if (state === State.PoweredOn) {
                complete('started');
            } else if (state === State.Unknown || state === State.Unsupported) {
                complete('failure');
            } else if (state === State.Unauthorized) {
                complete('denied');
            }
        })()
    });
}

export async function openDevice(params: { name?: string, id?: string }): Promise<BTDevice | null> {
    return null;
}