import * as React from 'react';
import { useAppModel } from '../../../global';
import { useRoute } from '@react-navigation/native';
import { KeyboardAvoidingView, Text, View } from 'react-native';
import { Theme } from '../../../theme';
import { Feed } from '../../feed/Feed';
import { SInput } from '../../components/SInput';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const ChatScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const id = (useRoute().params as any).id as string;
    const app = useAppModel();
    // const feed = app.feed.use(id);
    return (
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: Theme.background }} keyboardVerticalOffset={safeArea.top + 44}>
            <View style={{ flex: 1 }}>
                <Feed
                    feed={id}
                    display='inverted'
                    empty={<Text style={{ color: Theme.text, fontSize: 20, opacity: 0.6 }}>What can I help you with today?</Text>}
                />
            </View>
            <View style={{ marginHorizontal: 16, marginBottom: safeArea.bottom }}>
                <SInput placeholder='Type your message...' autoFocus={true} />
            </View>
        </KeyboardAvoidingView>
    );
});