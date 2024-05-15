import * as React from 'react';
import { ScrollView, Text } from 'react-native';
import { useLogs } from '../../../../../utils/logs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../../../theme';

export default React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const logs = useLogs();
    return (
        <ScrollView style={{ backgroundColor: Theme.background }} contentContainerStyle={{ paddingBottom: safeArea.bottom }}>
            {logs.map((v, i) => (
                <Text key={'log-' + i} style={{ color: Theme.text, paddingHorizontal: 16 }}>{v}</Text>
            ))}
        </ScrollView>
    )
});