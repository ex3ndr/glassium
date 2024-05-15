import * as React from 'react';
import { Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { markSkipNotifications, useGlobalStateController } from '@/global';
import { Theme } from '@/app/theme';
import { RoundButton } from '@/app/components/RoundButton';
import { useRefresh } from '../_resolve';

export default React.memo(() => {
    const refresh = useRefresh();
    const action = React.useCallback(async () => {
        await Notifications.requestPermissionsAsync();
        await refresh();
    }, []);
    const skip = React.useCallback(async () => {
        markSkipNotifications();
        await refresh();
    }, []);
    return (
        <View style={{ flexGrow: 1, backgroundColor: Theme.background, justifyContent: 'center' }}>
            <Text style={{ color: Theme.text, fontSize: 32, alignSelf: 'center', textAlign: 'center' }}>Glassium works best{'\n'}with notifications on</Text>
            <RoundButton title={'Enable notifications'} style={{ width: 250, alignSelf: 'center', marginTop: 32 }} action={action} />
            <RoundButton title={'Not now'} style={{ width: 250, alignSelf: 'center', marginTop: 32 }} display='inverted' action={skip} />
        </View>
    );
});