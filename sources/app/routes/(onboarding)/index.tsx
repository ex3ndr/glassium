import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Theme } from '../../theme';
import { _resolve, useRefresh } from './_resolve';
import { run } from '@/utils/run';

export default function Page() {
    const refresh = useRefresh();
    React.useEffect(() => run(refresh), []);
    return (
        <View style={{ flexGrow: 1, backgroundColor: Theme.background, alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={Theme.text} />
        </View>
    );
}