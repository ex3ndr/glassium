import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/app/theme';
import { useAppModel } from '@/global';
import { BatteryComponent } from '@/app/components/BatteryComponent';
import { useAtomValue } from 'jotai';
import { Image } from 'expo-image';
import { router } from 'expo-router';

export const TopBar = React.memo(() => {
    const appModel = useAppModel();
    const capture = appModel.capture.use();
    const wearable = appModel.useWearable();
    const endpointing = appModel.endpointing.use();
    const debug = useAtomValue(appModel.debug.enabled);

    // Resolve title and subtitle
    let title = 'Glassium';
    let subtitle = 'idle';
    let subtitleStyle: 'secondary' | 'warning' | 'active' = 'secondary';
    let battery: number | null = null;
    let enableMuteButton = false;
    if (debug) {
        title = 'Glassium (Debug)';
    }

    if (wearable.pairing === 'denied') {
        subtitle = 'pairing denied';
        subtitleStyle = 'warning';
    } else if (wearable.pairing === 'unavailable') {
        subtitle = 'bluetooth unavailable';
        subtitleStyle = 'warning';
    } else if (wearable.pairing === 'loading') {
        subtitle = 'loading'; // Rarely happen for brief moment
    } else if (wearable.pairing === 'ready') {
        if (wearable.device.status === 'connecting') {
            subtitle = 'connecting...';
            // subtitleStyle = 'warning';
        } else {
            if (wearable.device.status === 'disconnected') {
                // Should not happen
            } else if (wearable.device.status === 'connected' || wearable.device.status === 'subscribed') {

                // Update battery value
                if (wearable.device.battery) {
                    battery = wearable.device.battery;
                }

                // Resolve mute button
                if (wearable.profile && (!wearable.profile.features || (!wearable.profile.features.hasMuteSwitch && !wearable.profile.features.hasOffSwitch))) {
                    enableMuteButton = true;
                }

                // Update subtitle
                if (capture.streaming && !capture.localMute) {
                    if (endpointing === 'idle') {
                        subtitle = 'listening';
                    } else {
                        subtitle = 'voice detected';
                    }
                } else {
                    subtitle = 'connected';
                }
                subtitleStyle = 'active';
            }
        }
    } else if (wearable.pairing === 'need-pairing') {
        subtitle = 'need pairing';
        subtitleStyle = 'warning';
    }


    return (
        <View style={{ height: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', alignSelf: 'stretch' }}>
            <View style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 16, gap: 16 }}>
                {enableMuteButton && <Pressable onPress={() => appModel.capture.setLocalMute(!capture.localMute)} hitSlop={16}><Ionicons name={capture.localMute ? 'mic-off' : 'mic'} size={24} color={Theme.accent} /></Pressable>}
                {battery !== null && (<BatteryComponent level={battery} />)}
            </View>
            <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: Theme.text, fontSize: 20, fontWeight: '600' }}>{title}</Text>
                <View style={{ flexDirection: 'row' }}>
                    {subtitleStyle === 'warning' && <Ionicons name="warning-outline" size={14} color="red" style={{ transform: [{ translateY: 2 }], paddingRight: 3 }} />}
                    <Text style={[{ color: Theme.text, fontSize: 14, fontWeight: '500' }, styles[subtitleStyle]]}>
                        {subtitle}
                    </Text>
                </View>
            </View>
            <View style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16 }}>
                <Pressable onPress={() => router.navigate('settings')} hitSlop={16}>
                    {/* <Ionicons name="settings" size={24} color={Theme.accent} /> */}
                    <Image source={require('../../assets/gear_3d.png')} style={{ width: 24, height: 24 }} />
                </Pressable>
                {/* {wearable.device !== 'connecting' ? <Ionicons name="bluetooth-sharp" size={24} color="#16ea79" /> : <Ionicons name="bluetooth-sharp" size={24} color="red" />} */}
            </View>
        </View>
    )
});

const styles = StyleSheet.create({
    active: {
        color: Theme.accent
    },
    warning: {
        color: Theme.warninig
    },
    secondary: {
        opacity: 0.5
    }
});