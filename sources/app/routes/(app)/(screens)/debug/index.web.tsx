import * as React from 'react';
import { ScrollView, View } from 'react-native';
import * as Update from 'expo-updates';
import { Item } from '@/app/components/Item';
import { RoundButton } from '@/app/components/RoundButton';
import { Theme } from '@/app/theme';
import { router } from 'expo-router';
import { useAlert } from '@/app/libs/alert';

export default React.memo(() => {
    const alert = useAlert();
    const restartApp = async () => {
        await Update.reloadAsync();
    };
    return (
        <ScrollView style={{ flexGrow: 1, flexBasis: 0, backgroundColor: Theme.background }}>
            <Item title="Developer Tools" />
            <View style={{ alignItems: 'flex-start', paddingHorizontal: 16, flexDirection: 'column' }}>
                <RoundButton title={'Restart app'} size='small' action={restartApp} />
                <View style={{ height: 16 }} />
                <RoundButton title={'View logs'} size='small' onPress={() => router.navigate('/debug/logs')} />
                <View style={{ height: 16 }} />
                <RoundButton title={'Test Alert'} size='small' onPress={() => alert('Test!', 'Test body', [{ text: 'OK' }])} />
                <View style={{ height: 16 }} />
                <RoundButton title={'Views'} size='small' onPress={() => router.navigate('/debug/views')} />
            </View>
        </ScrollView>
    );
});