import * as React from 'react';
import { Text, View } from 'react-native';
import { Theme } from '../../../theme';

export const Banner = React.memo((props: { title: string, text: string, kind: 'normal' | 'warning' | 'alert', fixedSize?: true }) => {

    let bg = '#1d1d1d';
    if (props.kind === 'warning') {
        // bg = '#ff4d4d';
        bg = '#922626';
    } else if (props.kind === 'alert') {
        bg = '#354bc6';
    }

    return (
        <View style={{ backgroundColor: bg, borderRadius: 16, marginHorizontal: 16, marginVertical: 8, paddingHorizontal: 16, paddingVertical: 16, height: props.fixedSize ? 90 : undefined }}>
            <Text style={{ color: Theme.text, fontSize: 14, fontWeight: '600', opacity: 0.7 }}>{props.title}</Text>
            <Text style={{ color: Theme.text, fontSize: 18 }}>{props.text}</Text>
            {/* {props.actionTitle && (
                <View style={{ alignItems: 'flex-start', marginTop: 8 }}>
                    <RoundButton title={props.actionTitle} size='small' action={props.action} />
                </View>
            )} */}
        </View>
    )
});