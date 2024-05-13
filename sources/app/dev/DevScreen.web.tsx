import * as React from 'react';
import { ScrollView, View } from 'react-native';
import * as Update from 'expo-updates';
import { Item } from '../components/Item';
import { RoundButton } from '../components/RoundButton';
import { useRouter } from '../../routing';
import { Theme } from '../../theme';

export const DevScreen = React.memo(() => {
    const router = useRouter();
    const restartApp = async () => {
        await Update.reloadAsync();
    };
    return (
        <ScrollView style={{ flexGrow: 1, flexBasis: 0, backgroundColor: Theme.background }}>
            <Item title="Developer Tools" />
            <View style={{ alignItems: 'flex-start', paddingHorizontal: 16, flexDirection: 'column' }}>
                <RoundButton title={'Restart app'} size='small' action={restartApp} />
                <View style={{ height: 16 }} />
                <RoundButton title={'View logs'} size='small' onPress={() => router.navigate('logs')} />
                <View style={{ height: 16 }} />
                <RoundButton title={'View update logs'} size='small' onPress={() => router.navigate('update-logs')} />
            </View>
        </ScrollView>
    );
});