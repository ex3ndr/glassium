import * as React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppModel } from '@/global';
import { Theme } from '@/app/theme';
import { useLocalSearchParams } from 'expo-router';

export default React.memo(() => {
    const { id } = useLocalSearchParams();
    const app = useAppModel();
    const safeArea = useSafeAreaInsets();
    let memory = app.memory.use(id as string);
    return (
        <>
            <ScrollView style={{ flexGrow: 1, backgroundColor: Theme.background }} contentContainerStyle={{ paddingBottom: safeArea.bottom + 64 + 32 }}>
                {memory.image && <Image style={{ height: 'auto', aspectRatio: memory.image.width / memory.image.height, borderRadius: 16, maxWidth: 400, maxHeight: 400 }} source={{ uri: memory.image.url }} placeholder={{ thumbhash: memory.image.thumbhash }} />}
                {!memory.image && <View style={{ height: 16 }} />}
                <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0, paddingTop: 16, paddingHorizontal: 16 }}>
                    <Text style={{ fontSize: 24, marginBottom: 16, color: Theme.text }}>{memory.title}</Text>
                    <Text style={{ fontSize: 16, opacity: 0.7, color: Theme.text }}>{memory.summary}</Text>
                </View>
            </ScrollView>
            {/* <View style={{ position: 'absolute', bottom: safeArea.bottom, left: 0, right: 0, alignItems: 'stretch' }}>
                <Pressable style={{ height: 48, borderRadius: 32, backgroundColor: '#222222', justifyContent: 'center', alignItems: 'center', marginHorizontal: 16, marginVertical: 16 }} onPress={() => router.navigate('discussion')}>
                    <Text style={{ color: Theme.text, fontSize: 16 }}>Chat with AI</Text>
                </Pressable>
            </View> */}
        </>
    );
});