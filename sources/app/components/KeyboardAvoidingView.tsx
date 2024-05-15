import * as React from 'react';
import { useHeaderHeight } from "@react-navigation/elements";
import { KeyboardAvoidingView as KeyboardAvoidingViewBase, KeyboardAvoidingViewProps, Platform } from 'react-native';

// HINT: https://medium.com/@felippepuhle/react-native-quick-tip-solving-keyboardavoidingview-problems-on-screens-using-native-headers-or-1c77b5ec417c
export const KeyboardAvoidingView = React.memo((props: KeyboardAvoidingViewProps) => {
    const headerHeight = useHeaderHeight();
    return (
        <KeyboardAvoidingViewBase
            behavior="padding"
            enabled={Platform.OS === 'ios'}
            keyboardVerticalOffset={headerHeight}
            {...props}
        />
    );
});