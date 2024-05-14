import * as React from 'react'
import { ActivityIndicator, Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { Theme, ThemeApp } from '@/app/theme';

export const SButton = React.memo((props: { title: string, style?: StyleProp<ViewStyle>, loading?: boolean, disabled?: boolean, onPress?: () => void }) => {
    return (
        <Pressable onPress={props.onPress} style={props.style} disabled={props.disabled || props.loading}>
            {(state) => (
                <View style={{ backgroundColor: state.pressed ? ThemeApp.button.bgPressed : ThemeApp.button.bg, height: 50, minWidth: 100, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                    {props.loading === true && (
                        <View>
                            <ActivityIndicator color={ThemeApp.button.text} />
                        </View>
                    )}
                    {props.loading !== true && (
                        <Text style={{ color: ThemeApp.button.text, fontSize: 18, fontWeight: '600' }}>
                            {props.title}
                        </Text>
                    )}
                </View>
            )}
        </Pressable>
    );
});