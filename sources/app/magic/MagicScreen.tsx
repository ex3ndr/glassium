import * as React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { useRouter } from '../../routing';

export const MagicScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const router = useRouter();

    return (
        <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom + 64 }}>
            {/* <ScrollView style={{ flex: 1 }}>

            </ScrollView> */}
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: Theme.text, fontSize: 24, opacity: 0.7 }}>Soon.</Text>
            </View>
            <Pressable style={{ height: 48, borderRadius: 32, backgroundColor: '#222222', justifyContent: 'center', alignItems: 'center', marginHorizontal: 16, marginVertical: 16 }} onPress={() => router.navigate('new-thread')}>
                <Text style={{ color: Theme.text, fontSize: 16 }}>What do you want to know?</Text>
            </Pressable>
        </View>
    );
});