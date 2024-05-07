import * as React from 'react';
import { KeyboardAvoidingView, Text, TextInput, View } from 'react-native';
import { Theme } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useChat } from './useChat';
import { randomKey } from '../../modules/crypto/randomKey';
import { storage } from '../../storage';

const ChatMessage = React.memo(() => {
    return null;
});

const ChatEmpty = React.memo(() => {
    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <Text style={{ color: Theme.text }}>Chat is empty</Text>
        </View>
    )
});

export const DiscussScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const chatId = React.useMemo(() => storage.getString('discusss-default-chat') || randomKey(), []);
    const chat = useChat(chatId);

    return (
        <KeyboardAvoidingView
            style={{ flexGrow: 1, backgroundColor: Theme.background }}
            behavior="padding"
            keyboardVerticalOffset={safeArea.top + 44}
        >
            <View style={{ flexGrow: 1, backgroundColor: Theme.background, paddingBottom: safeArea.bottom }}>
                <View style={{ flex: 1 }}>
                    <FlashList
                        data={[]}
                        renderItem={({ item }) => <ChatMessage />}
                        ListEmptyComponent={<ChatEmpty />}
                    />
                </View>
                <TextInput
                    style={{
                        height: 48,
                        borderRadius: 32,
                        backgroundColor: '#222222',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginHorizontal: 16,
                        // marginVertical: 16,
                        paddingHorizontal: 24,
                        color: Theme.text,
                        fontSize: 18
                    }}
                    autoFocus={true}
                    placeholder='Type your message...'
                    blurOnSubmit={false}
                />
            </View>
        </KeyboardAvoidingView>
    );
});