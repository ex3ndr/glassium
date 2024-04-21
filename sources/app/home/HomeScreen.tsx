import * as React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useAppModel } from '../../global';
import { Theme } from '../../theme';
import { useAtomValue } from 'jotai';
import { Memory } from '../../modules/api/schema';
import { InvalidateSync } from 'teslabot';
import { backoff } from '../../utils/time';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from '../../routing';
import { HomeNotification } from './HomeNotification';

function useMemories() {
    const app = useAppModel();
    const [list, setList] = React.useState<Memory[] | null>(null);
    React.useEffect(() => {
        let exited = false;
        let sync = new InvalidateSync(async () => {
            if (exited) {
                return;
            }
            let memories = await app.client.getMemories();
            if (exited) {
                return;
            }
            setList(memories);
        }, { backoff });
        let inteval = setInterval(() => {
            sync.invalidate();
        }, 5000);
        return () => {
            exited = true;
            clearInterval(inteval);
        };
    }, []);
    return list;
}

export const HomeScreen = React.memo(() => {
    const router = useRouter();
    const safeArea = useSafeAreaInsets();
    const app = useAppModel();
    const realtime = app.realtime.use();
    const captureState = useAtomValue(app.capture.captureState);
    const memories = useMemories();
    return (
        <View style={{ flexGrow: 1 }}>
            <ScrollView style={{}} contentContainerStyle={{ paddingBottom: 64 + safeArea.bottom, flexGrow: 1 }} alwaysBounceVertical={false} scrollIndicatorInsets={{ top: 0, bottom: 64 }}>
                <HomeNotification />
                {captureState.streaming && (
                    <>
                        <View style={{ marginHorizontal: 16, paddingHorizontal: 16, backgroundColor: '#445ef1', borderRadius: 32, paddingVertical: 16, marginVertical: 16, height: 128 }}>
                            <Text style={{ color: 'white', fontSize: 24, minHeight: 128 - 32, position: 'absolute', bottom: 16, left: 16, right: 16 }}>{realtime ? realtime : '...'}</Text>
                        </View>
                    </>
                )}
                {memories === null && (
                    <View style={{ marginHorizontal: 16, flexGrow: 1, justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                        <ActivityIndicator />
                    </View>
                )}
                {memories !== null && memories.length == 0 && (
                    <View style={{ marginHorizontal: 16, flexGrow: 1, justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                        <Text style={{ textAlign: 'center', fontSize: 20, marginVertical: 16, marginHorizontal: 16, color: Theme.textSecondary }}>
                            To start capturing your memories, activate your device.
                        </Text>
                    </View>
                )}
                {memories !== null && memories.length > 0 && (
                    memories.map((memory) => (
                        <Pressable key={memory.id} style={{ borderRadius: 32, marginHorizontal: 16, marginVertical: 16, flexDirection: 'row' }} onPress={() => router.navigate('memory', { data: memory })}>
                            {memory.image ? (
                                <Image source={{ uri: memory.image }} style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 0.5, borderColor: '#e9e9e9' }} />
                            ) : <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Theme.textSecondary }} />}
                            <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0, marginLeft: 16 }}>
                                <Text style={{ fontSize: 16, color: Theme.text }} numberOfLines={3}>{memory.title}</Text>
                                <Text style={{ fontSize: 14, opacity: 0.7, color: Theme.text }} numberOfLines={1}>{memory.summary.replaceAll('\n', ' ')}</Text>
                            </View>
                        </Pressable>
                    ))
                )}
            </ScrollView>
        </View >
    );
});