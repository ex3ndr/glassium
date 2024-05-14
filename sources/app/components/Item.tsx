import * as  React from 'react';
import { Text, View } from 'react-native';
import { Theme } from '@/app/theme';

export const Item = React.memo((props: { title: string }) => {
    return (
        <View style={{ paddingHorizontal: 16, marginVertical: 8 }}>
            <Text numberOfLines={1} style={{ fontSize: 18, color: Theme.text }}>{props.title}</Text>
        </View >
    )
});