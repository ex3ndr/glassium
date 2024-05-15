import * as React from 'react';
import { KeyboardAvoidingView as KeyboardAvoidingViewBase, KeyboardAvoidingViewProps, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const KeyboardAvoidingView = React.memo((props: KeyboardAvoidingViewProps) => {
    const safeArea = useSafeAreaInsets();
    return (
        <KeyboardAvoidingViewBase
            behavior="padding"
            enabled={Platform.OS === 'ios'}
            keyboardVerticalOffset={safeArea.bottom + 44}
            {...props}
        />
    );
});