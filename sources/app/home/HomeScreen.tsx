import * as React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useAppModel } from '../../global';
import { Theme } from '../../theme';
import { useAtomValue } from 'jotai';
import { Memory } from '../../modules/api/schema';
import { InvalidateSync } from 'teslabot';
import { backoff } from '../../utils/time';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from '../../routing';
import { HomeNotification } from './HomeNotification';
import { FlashList } from '@shopify/flash-list';

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
        sync.invalidate();
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

const MemoryComponent = React.memo((props: { memory: Memory }) => {
    const router = useRouter();

    let image;
    if (props.memory.image && props.memory.imageMetadata) {
        image = (
            <Image
                source={{ uri: props.memory.image, thumbhash: props.memory.imageMetadata.thumbhash }}
                style={{ width: 'auto', height: 'auto', aspectRatio: props.memory.imageMetadata.width / props.memory.imageMetadata.height, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}

            />
        )
    } else {
        image = <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Theme.warninig }} />
    }

    return (
        <Pressable key={props.memory.id} style={{ marginHorizontal: 16, marginVertical: 16, borderRadius: 16, borderWidth: 0.5, borderColor: '#272727', flexDirection: 'column', backgroundColor: 'white' }} onPress={() => router.navigate('memory', { data: props.memory })}>
            {image}
            <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0, marginTop: 8, marginHorizontal: 8, marginBottom: 16 }}>
                <Text style={{ fontSize: 16, color: Theme.textInverted }} numberOfLines={3}>{props.memory.title}</Text>
                <Text style={{ fontSize: 14, opacity: 0.6, color: Theme.textInverted }} numberOfLines={2}>{props.memory.summary.replaceAll('\n', ' ')}</Text>
            </View>
        </Pressable>
    );
});

export const HomeScreen = React.memo(() => {
    const router = useRouter();
    const safeArea = useSafeAreaInsets();
    const memories = useMemories();

    // Render list
    if (memories !== null && memories.length > 0) {
        return (
            <View style={{ flexGrow: 1 }}>
                <FlashList
                    data={memories}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={<HomeNotification />}
                    renderItem={({ item }) => (
                        <MemoryComponent key={item.id} memory={item} />
                    )}
                />
            </View>

        )
    }

    return (
        <View style={{ flexGrow: 1 }}>
            <ScrollView style={{}} contentContainerStyle={{ paddingBottom: 64 + safeArea.bottom, flexGrow: 1 }} alwaysBounceVertical={false} scrollIndicatorInsets={{ top: 0, bottom: 64 }}>
                <HomeNotification />
                {/* {captureState.streaming && (
                    <>
                        <View style={{ marginHorizontal: 16, paddingHorizontal: 16, backgroundColor: '#445ef1', borderRadius: 32, paddingVertical: 16, marginVertical: 16, height: 128 }}>
                            <Text style={{ color: 'white', fontSize: 24, minHeight: 128 - 32, position: 'absolute', bottom: 16, left: 16, right: 16 }}>{realtime ? realtime : '...'}</Text>
                        </View>
                    </>
                )} */}
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
            </ScrollView>
        </View>
    );
});