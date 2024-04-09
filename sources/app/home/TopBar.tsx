import * as React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme';
import { useAppModel } from '../../global';

export const TopBar = React.memo(() => {
    const appModel = useAppModel();
    const sessions = appModel.useSessions();
    const wearable = appModel.useWearable();
    let title = 'Super';
    let subtitle = 'Super subtitle';
    if (wearable.pairing !== 'need-pairing') {
        if (wearable.pairing === 'denied') {
            subtitle = 'Pairing denied';
        } else if (wearable.pairing === 'unavailable') {
            subtitle = 'Bluetooth unavailable';
        } else if (wearable.pairing === 'loading') {
            subtitle = 'loading';
        } else if (wearable.pairing === 'ready') {
            if (wearable.device === 'connecting') {
                subtitle = 'connecting...';
            } else {
                if (wearable.device === 'connected') {
                    subtitle = 'connected';
                } else if (wearable.device === 'subscribing') {
                    subtitle = 'starting...';
                } else if (wearable.device === 'subscribed') {
                    subtitle = 'listening';
                }
            }
        }
    }
    return (
        <View style={{ height: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
            <View style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'row', justifyContent: 'flex-start', paddingHorizontal: 32 }} />
            <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: Theme.text, fontSize: 20, fontWeight: '600' }}>{title}</Text>
                <Text style={{ color: Theme.text, fontSize: 14 }}>{subtitle}</Text>
            </View>
            <View style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 32 }}>
                {wearable.device !== 'connecting' ? <Ionicons name="bluetooth-sharp" size={24} color="#16ea79" /> : <Ionicons name="bluetooth-sharp" size={24} color="red" />}
            </View>
        </View>
    )
});