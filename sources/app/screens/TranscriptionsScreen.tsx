import * as React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feed } from '../feed/Feed';
import { Theme } from '../../theme';

export const TranscriptionsScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    return (
        <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom, backgroundColor: Theme.background }}>
            <Feed feed={'default'} display='inverted' />
        </View>
    );
});