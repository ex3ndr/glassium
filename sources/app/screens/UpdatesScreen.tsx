import * as React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feed } from '../feed/Feed';

export const UpdatesScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    return (
        <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom + 64 }}>
            <Feed feed={'default'} inverted={true} />
        </View>
    );
});