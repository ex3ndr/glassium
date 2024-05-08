import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { useRouter } from '../../routing';
import { Feed } from '../feed/Feed';

export const MagicScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const router = useRouter();
    return (
        <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom + 64 }}>
            <Feed feed={'default'} inverted={true} />
            <View style={{ position: 'absolute', bottom: safeArea.bottom + 64, left: 0, right: 0, alignItems: 'stretch' }}>
                <Pressable style={{ height: 48, borderRadius: 32, backgroundColor: '#222222', justifyContent: 'center', alignItems: 'center', marginHorizontal: 16, marginVertical: 16 }} onPress={() => router.navigate('discussion')}>
                    <Text style={{ color: Theme.text, fontSize: 16 }}>Chat with AI</Text>
                </Pressable>
            </View>
        </View>
    );
});