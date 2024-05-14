import * as React from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { Theme } from '../../theme';
import { useHappyAction } from '../../utils/useHappyAction';

const icons = {
    'compass': require('../assets/device_compass.png'),
    'friend': require('../assets/device_friend.png'),
    'bubble': require('../assets/device_bubble.png')
}

export const DeviceComponent = React.memo((props: { kind: 'compass' | 'friend' | 'bubble', title: string, subtitle: string, action?: () => Promise<any> }) => {
    const [action, doAction] = useHappyAction(props.action ?? (() => Promise.resolve()));
    return (
        <Pressable
            style={(p) => ({
                backgroundColor: p.pressed ? '#111111' : '#1c1c1c',
                alignSelf: 'stretch',
                height: 86,
                borderRadius: 16,
                alignItems: 'center',
                paddingHorizontal: 16,
                flexDirection: 'row'
            })}
            onPress={doAction}
            disabled={!props.action || action}
        >
            <View>
                <Image source={icons[props.kind]} style={{ width: 64, height: 64, borderRadius: 8 }} resizeMode='stretch' />
                {action && (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                        <ActivityIndicator />
                    </View>
                )}
            </View>
            <View style={{ paddingLeft: 16, flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                <Text style={{ fontSize: 18, color: Theme.text }} numberOfLines={1}>{props.title}</Text>
                <Text style={{ fontSize: 14, color: Theme.text, opacity: 0.7 }} numberOfLines={1}>{props.subtitle}</Text>
            </View>
        </Pressable>
    )
});