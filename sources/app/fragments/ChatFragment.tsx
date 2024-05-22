import * as React from 'react';
import { KeyboardAvoidingView } from '../components/KeyboardAvoidingView';
import { TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const ChatFragment = React.memo((props: { id: string }) => {
    const safeAreaInsets = useSafeAreaInsets();
    return (
        <KeyboardAvoidingView style={{ flexGrow: 1, flexBasis: 0, marginBottom: safeAreaInsets.bottom }}>
            <View style={{ flexGrow: 1, flexBasis: 0 }}>

            </View>
            <View style={{}}>
                <TextInput
                    style={{
                        backgroundColor: '#252525',
                        marginVertical: 16,
                        marginHorizontal: 16,
                        minHeight: 48,
                        borderRadius: 24,
                        fontSize: 18,
                        paddingHorizontal: 18,
                        color: '#fff'
                    }}
                    placeholder='Type a message...'
                    blurOnSubmit={false}
                />
            </View>
        </KeyboardAvoidingView>
    );
});