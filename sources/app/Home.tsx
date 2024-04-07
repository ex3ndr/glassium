import * as React from 'react';
import { Text, View } from 'react-native';
import { RoundButton } from './components/RoundButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../theme';
import { useAppState, useClient } from '../global';
import { useHappyAction } from './helpers/useHappyAction';
import { randomKey } from '../modules/crypto/randomKey';
import { openDevice, startBluetooth } from '../modules/wearable/bt';
import { resolveProtocol } from '../modules/wearable/protocol';
import { HappyError } from '../modules/errors/HappyError';

export const HomeScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const appState = useAppState();
    // const [starting, startSession] = useHappyAction(async () => {

    //     // Starting session
    //     let key = randomKey();
    //     let session = await client.startSession(key);
    //     console.warn(session);

    //     // Starting streaming
    //     let results = await startBluetooth();
    //     let device = await openDevice({ name: 'Super' });
    //     if (device === null) {
    //         throw new HappyError('Device not found', false);
    //     }
    //     let protocol = await resolveProtocol(device);
    //     if (!protocol) {
    //         throw new HappyError('Device not found', false);
    //     }
    // });
    return (
        <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingTop: safeArea.top, paddingBottom: safeArea.bottom }}>
            <View style={{ height: 48, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: Theme.text, fontSize: 24 }}>Super</Text>
            </View>
            <View style={{ flexGrow: 1 }} />
            <RoundButton title="Record" onPress={() => appState.startSession()} />
        </View>
    );
});