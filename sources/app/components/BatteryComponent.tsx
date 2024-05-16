import * as React from 'react';
import { Platform, Text, View } from 'react-native';

export const BatteryComponent = React.memo((props: { level: number }) => {
    return (
        <View style={{ height: 16, width: 32, borderRadius: 4, backgroundColor: 'white' }}>
            <Text style={{ position: 'absolute', top: 0, left: 0, width: 32, bottom: 0, color: 'black', fontSize: 12, fontWeight: '600', textAlign: 'center', transform: [{ translateY: Platform.OS === 'android' ? -0.5 : 0 }] }}>{props.level}</Text>
            <View style={{ height: 16, width: 32 * props.level / 100, backgroundColor: props.level < 15 ? '#ab1c4e' : '#0b650b', borderRadius: 4, overflow: 'hidden' }}>
                <Text style={{ position: 'absolute', top: 0, left: 0, width: 32, bottom: 0, color: 'white', fontSize: 12, fontWeight: '600', textAlign: 'center', transform: [{ translateY: Platform.OS === 'android' ? -0.5 : 0 }] }}>{props.level}</Text>
            </View>
        </View>
    );
});