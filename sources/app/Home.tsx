import * as React from 'react';
import { Text, View } from 'react-native';
import { RoundButton } from './components/RoundButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../theme';
import { useClient } from '../global';
import { useHappyAction } from './helpers/useHappyAction';
import { randomKey } from '../modules/crypto/randomKey';

export const HomeScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const client = useClient();
    const [starting, startSession] = useHappyAction(async () => {
        let key = randomKey();
        let session = await client.startSession(key);
        console.warn(session);
    });
    return (
        <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingTop: safeArea.top, paddingBottom: safeArea.bottom }}>
            <View style={{ height: 48, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: Theme.text, fontSize: 24 }}>Super</Text>
            </View>
            <View style={{ flexGrow: 1 }} />
            <RoundButton title="Record" onPress={startSession} loading={starting} />
        </View>
    );
});