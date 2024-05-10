import * as React from 'react';
import * as Updates from 'expo-updates';
import { Theme } from '../../theme';
import { ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const UpdateLogScreen = React.memo(() => {

    const safeArea = useSafeAreaInsets();
    let logs: string[] = [];
    React.useEffect(() => {
        Updates.readLogEntriesAsync().then((logEntries) => {
            logEntries.map((v) => logs.push(v.message));
        });
    }, []);

    return (
        <ScrollView style={{ backgroundColor: Theme.background }} contentContainerStyle={{ paddingBottom: safeArea.bottom }}>
            {logs.map((v, i) => (
                <Text key={'log-' + i} style={{ color: Theme.text, paddingHorizontal: 16 }}>{v}</Text>
            ))}
        </ScrollView>
    );
});