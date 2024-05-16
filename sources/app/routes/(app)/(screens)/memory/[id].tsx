import * as React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppModel } from '@/global';
import { Theme } from '@/app/theme';
import { useLocalSearchParams } from 'expo-router';

export default React.memo(() => {
    const { id } = useLocalSearchParams();
    const app = useAppModel();
    const safeArea = useSafeAreaInsets();
    let memory = app.memory.use(id as string);

    if (!memory) {
        return (
            <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color={Theme.text} />
            </View>
        )
    }
    return (
        <>
            <ScrollView style={{ flexGrow: 1, backgroundColor: Theme.background }} contentContainerStyle={{ paddingBottom: safeArea.bottom + 64 + 32, marginHorizontal: 16 }}>
                {memory.image && (
                    <Animated.View>
                        <Image
                            style={{
                                height: 'auto',
                                aspectRatio: memory.image.width / memory.image.height,
                                borderRadius: 16,
                                maxWidth: 400,
                                maxHeight: 400
                            }}
                            source={{ uri: memory.image.url }}
                            placeholder={{ thumbhash: memory.image.thumbhash }}
                        />
                    </Animated.View>
                )}
                <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0, paddingTop: 16, paddingHorizontal: 16 }}>
                    <Text style={{ fontSize: 24, marginBottom: 16, color: Theme.text }}>{memory.title}</Text>
                    <Text style={{ fontSize: 16, opacity: 0.7, color: Theme.text }}>{memory.summary}</Text>
                </View>
            </ScrollView>
        </>
    );
});