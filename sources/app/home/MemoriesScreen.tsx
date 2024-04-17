import * as React from 'react';
import { Text, View } from 'react-native';
import { useAppModel } from '../../global';
import { Theme } from '../../theme';

export const MemoriesScreen = React.memo(() => {
    const app = useAppModel();
    const realtime = app.realtime.use();
    const wearable = app.wearable.use();
    let muted = !!(wearable.device?.status === 'connected' && wearable.device.muted);
    return (
        <View>
            {muted && (
                <View style={{ marginHorizontal: 16, paddingHorizontal: 16, backgroundColor: Theme.accent, borderRadius: 32, paddingVertical: 16, marginVertical: 16 }}>
                    <Text style={{ color: 'white', fontSize: 24 }}>Please, allow microphone access by pressing a button on device</Text>
                </View>
            )}
            <View style={{ marginHorizontal: 16, paddingHorizontal: 16, backgroundColor: '#445ef1', borderRadius: 32, paddingVertical: 16, marginVertical: 16, height: 128 }}>
                <Text style={{ color: 'white', fontSize: 24 }} numberOfLines={3}>{realtime ? realtime : '...'}</Text>
            </View>
        </View>
    );
});