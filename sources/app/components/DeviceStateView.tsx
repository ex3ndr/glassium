import { Image } from 'expo-image';
import * as React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { DeviceState } from './useDeviceState';
import { router } from 'expo-router';
import { useAppModel } from '@/global';

const icons = {
    'compass': require('../assets/device_compass.png'),
    'friend': require('../assets/device_friend.png'),
    'bubble': require('../assets/device_bubble.png')
}

export const DeviceStateView = React.memo((props: { state: DeviceState | null }) => {

    let app = useAppModel();
    let title = 'No device';
    let subtitle = 'Press to connect';
    let image = <Ionicons name="code-working" size={32} color="white" style={{ opacity: 0.3 }} />
    let activeSubtitle = false;
    let action = () => {
        if (app.wearable.bluetooth.supportsScan) {
            router.navigate('/settings/device')
        } else if (app.wearable.bluetooth.supportsPick) {
            app.wearable.pick();
        }
    }
    if (props.state) {
        if (props.state.paired) {
            title = props.state.name;
            if (props.state.state === 'connected') {
                if (props.state.muted !== undefined && props.state.muted || props.state.softMuted) {
                    subtitle = 'Muted';
                } else {
                    activeSubtitle = props.state.voice || false;
                    subtitle = 'Listening';
                }
                if (props.state.battery !== undefined) {
                    subtitle += ' • ' + props.state.battery + '%';
                }
            } else if (props.state.state === 'connecting') {
                subtitle = 'Connecting...';
            } else if (props.state.state === 'denied') {
                subtitle = 'Allow bluetooth';
            } else if (props.state.state === 'unavailable') {
                subtitle = 'action';
            }
            image = <Image source={icons[props.state.vendor]} style={{ width: 48, height: 48, borderRadius: 8, opacity: 0.3 }} resizeMode='stretch' />
        } else {
            switch (props.state.state) {
                case 'denied':
                    title = 'Permission denied';
                    subtitle = 'Open settings';
                    break;
                case 'unavailable':
                    title = 'Unsupported';
                    subtitle = 'No Bluetooth';
                    break;
            }
        }
    }

    return (
        <Pressable
            style={(p) => ({
                backgroundColor: p.pressed ? '#111111' : '#1c1c1c',
                width: 208, // Sidebar width - paddings
                height: 64,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 8,
                flexDirection: 'row',
            })}
            onPress={action}
        >
            <View style={{ width: 48, height: 48, backgroundColor: '#303030', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                {image}
            </View>
            <View style={{ paddingLeft: 9, flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                <Text style={{ fontSize: 18, color: Theme.text, marginBottom: Platform.select({ default: 0, android: -4 }) }} numberOfLines={1}>{title}</Text>
                <Text style={{ fontSize: 14, color: activeSubtitle ? '#8e9ff2' : Theme.text, opacity: 0.7 }} numberOfLines={1}>{subtitle}</Text>
            </View>
        </Pressable>
    )
});