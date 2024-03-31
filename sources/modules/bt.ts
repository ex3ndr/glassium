import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, State } from 'react-native-ble-plx';

let _manager: BleManager | null = null;
function manager() {
    if (_manager === null) {
        _manager = new BleManager();
    }
    return _manager;
}

type StartResult = 'started' | 'denied' | 'failure';

export async function startBluetooth() {

    // Check current state
    let state = await manager().state();
    if (state === State.PoweredOn) {
        return 'started';
    } else if (state === State.Unknown || state === State.Unsupported) {
        return 'failure';
    } else if (state === State.Unauthorized) {
        return 'denied';
    }
    // NOTE: Here state is Resetting or PoweredOff


    // if (state. === '')

    // React.useEffect(() => {
    //     const subscription = manager.onStateChange(state => {
    //       if (state === 'PoweredOn') {
    //         scanAndConnect()
    //         subscription.remove()
    //       }
    //     }, true)
    //     return () => subscription.remove()
    //   }, [manager])
}