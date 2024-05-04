import * as React from 'react';
import * as fs from 'expo-file-system';
import { ScrollView, Share, View } from 'react-native';
import * as Update from 'expo-updates';
import { Item } from '../components/Item';
import { RoundButton } from '../components/RoundButton';
import { useRouter } from '../../routing';
import { Theme } from '../../theme';
import { useAppModel } from '../../global';
import { useAtomValue } from 'jotai';
import { SButton } from '../components/SButton';
import { format } from 'date-fns';

export const DevScreen = React.memo(() => {
    const app = useAppModel();
    const router = useRouter();
    const restartApp = async () => {
        await Update.reloadAsync();
    };
    const sessions = [...useAtomValue(useAppModel().debug.sessions)].reverse();
    const debugEnabled = useAtomValue(useAppModel().debug.enabled);
    const exportSession = async (id: string) => {
        Share.share({
            url: fs.documentDirectory + id + '.zip',
        });
    }
    return (
        <ScrollView style={{ flexGrow: 1, flexBasis: 0, backgroundColor: Theme.background }}>
            <Item title="Developer Tools" />
            <View style={{ alignItems: 'flex-start', paddingHorizontal: 16, flexDirection: 'column' }}>
                <RoundButton title={'Restart app'} size='small' action={restartApp} />
                <View style={{ height: 16 }} />
                <RoundButton title={'View logs'} size='small' onPress={() => router.navigate('logs')} />
            </View>
            <View style={{ height: 16 }} />
            <Item title="Debug Capture" />
            <View style={{ alignItems: 'flex-start', paddingHorizontal: 16, flexDirection: 'column' }}>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                    {!debugEnabled ? (
                        <RoundButton title={'Start Capture'} size='small' action={() => app.debug.doStartDebug()} />
                    ) : (
                        <>
                            <RoundButton title={'Stop Capture'} size='small' action={() => app.debug.doStopDebug()} />
                            <RoundButton title={'Flush'} size='small' action={() => app.debug.doFlushDebug()} />
                        </>
                    )}
                </View>
            </View>
            <View style={{ flexDirection: 'column', alignItems: 'stretch', marginHorizontal: 16, marginVertical: 16, gap: 16 }}>
                {sessions.map((s) => (
                    <SButton key={s.id} title={'Export ' + format(s.startedAt, 'yyyy-MM-dd HH:mm:ss')} onPress={() => exportSession(s.id)} />
                ))}
            </View>
        </ScrollView>
    );
});