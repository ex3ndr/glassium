import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../../theme';
import { useAppModel } from '../../../global';
import { BatteryComponent } from './BatteryComponent';

export const TopBar = React.memo(() => {
    const appModel = useAppModel();
    const sessions = appModel.useSessions();
    const wearable = appModel.useWearable();

    // Resolve title and subtitle
    let title = 'Bubble';
    let subtitle = 'idle';
    let subtitleStyle: 'secondary' | 'warning' | 'active' = 'secondary';
    let battery: number | null = null;

    if (wearable.pairing === 'denied') {
        subtitle = 'pairing denied';
        subtitleStyle = 'warning';
    } else if (wearable.pairing === 'unavailable') {
        subtitle = 'bluetooth unavailable';
        subtitleStyle = 'warning';
    } else if (wearable.pairing === 'loading') {
        subtitle = 'loading';
    } else if (wearable.pairing === 'ready') {
        if (wearable.device.status === 'connecting') {
            subtitle = 'connecting...';
            subtitleStyle = 'warning';
        } else {
            if (wearable.device.status === 'disconnected') {
                // Should not happen
            } else if (wearable.device.status === 'connected') {
                if (wearable.device.battery) {
                    battery = wearable.device.battery;
                }
                subtitle = 'connected';
            } else if (wearable.device.status === 'subscribed') {
                if (wearable.device.battery) {
                    battery = wearable.device.battery;
                }
                subtitle = 'listening';
                subtitleStyle = 'active';
            }
        }
    } else if (wearable.pairing === 'need-pairing') {
        subtitle = 'need pairing';
        subtitleStyle = 'warning';
    }


    return (
        <View style={{ height: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
            <View style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'row', justifyContent: 'flex-start', paddingHorizontal: 32 }}>
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
            <View style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 32 }}>
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