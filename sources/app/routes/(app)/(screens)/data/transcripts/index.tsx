import { Feed } from '@/app/components/feed/Feed';
import { Theme } from '@/app/theme';
import * as React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const footer = <View style={{ height: 48 }} />
    return (
        <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom, backgroundColor: Theme.background }}>
            <Feed feed={'default'} display='inverted' footer={() => footer} />
        </View>
    );
});