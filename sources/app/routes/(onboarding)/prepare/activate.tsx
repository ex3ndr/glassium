import { RoundButton } from '@/app/components/RoundButton';
import { Theme } from '@/app/theme';
import { useClient } from '@/global';
import { useLayout } from '@/utils/useLayout';
import * as React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { _resolve, useRefresh } from '../_resolve';

export default React.memo(() => {
    const refresh = useRefresh();
    const safeArea = useSafeAreaInsets();
    const client = useClient();
    const layout = useLayout();
    const action = React.useCallback(async () => {
        await client.preComplete();
        await refresh();
    }, []);
    return (
        <View style={{ flexGrow: 1, backgroundColor: Theme.background, justifyContent: 'center', paddingHorizontal: 32, paddingTop: safeArea.top, paddingBottom: safeArea.bottom }}>
            <View style={{ flexGrow: 1 }} />
            <Text style={{ color: Theme.text, fontSize: 32, alignSelf: 'center', textAlign: 'center' }}>Be respectful</Text>
            <Text style={{ color: Theme.text, fontSize: 20, alignSelf: 'center', textAlign: 'center', marginTop: 32, marginBottom: 32 }}>Please, be respectful to pepole around you and turn off AI when asked.</Text>
            {layout === 'small' && (
                <View style={{ flexGrow: 1 }} />
            )}
            <RoundButton title={'Create account'} style={{ width: 250, alignSelf: 'center', marginBottom: 32 }} action={action} />
            {layout === 'large' && (
                <View style={{ flexGrow: 1 }} />
            )}
        </View>
    );
});