import * as React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useRouter } from '../../routing';
import { Item } from '../components/Item';
import { useAppModel } from '../../global';
import { RoundButton } from '../components/RoundButton';
import { Theme } from '../../theme';
import { DeviceComponent } from '../components/DeviceComponent';

export const SettingsScreen = React.memo(() => {
    const appModel = useAppModel();
    const wearable = appModel.wearable.use();
    const router = useRouter();
    return (
        <View>
            <Item title="Device" />
            {wearable.pairing === 'loading' && (
                <View style={{ alignItems: 'flex-start', paddingHorizontal: 16, flexDirection: 'column' }}>
                    <ActivityIndicator />
                </View>
            )}
            {wearable.pairing === 'denied' && (
                <View style={{ alignItems: 'flex-start', paddingHorizontal: 16, flexDirection: 'column' }}>
                    <Text style={{ fontSize: 18, color: Theme.text, marginBottom: 8, opacity: 0.8 }}>Bubble requires bluetooth access. Please, allow it in the settings.</Text>
                    <RoundButton title={'Open settings'} size='small' />
                </View>
            )}
            {wearable.pairing === 'unavailable' && (
                <View style={{ alignItems: 'flex-start', paddingHorizontal: 16, flexDirection: 'column' }}>
                    <Text style={{ fontSize: 18, color: Theme.text, marginBottom: 8, opacity: 0.8 }}>Bubble requires bluetooth, but this device doesn't have one.</Text>
                </View>
            )}
            {wearable.pairing === 'need-pairing' && (
                <View style={{ alignItems: 'flex-start', paddingHorizontal: 16, flexDirection: 'column' }}>
                    <Text style={{ fontSize: 18, color: Theme.text, marginBottom: 8, opacity: 0.8 }}>No device paired, please add your device to the app.</Text>
                    <RoundButton title={'Pair new device'} size='small' onPress={() => { router.navigate('manage-device') }} />
                </View>
            )}
            {wearable.pairing === 'ready' && (
                <View style={{ alignItems: 'flex-start', paddingHorizontal: 16, flexDirection: 'column' }}>
                    <DeviceComponent
                        title={wearable.profile!.name}
                        kind='bubble'
                        subtitle={
                            (wearable.device.status === 'connected' || wearable.device.status === 'subscribed')
                                ? (wearable.device.battery !== null ? wearable.device.battery + '% battery' : 'Connected')
                                : 'Connecting...'
                        }
                        action={async () => { router.navigate('manage-device') }}
                    />
                </View>
            )}
            <View style={{ height: 16 }} />
            <Item title="Data" />
            <View style={{ alignItems: 'flex-start', paddingHorizontal: 16, flexDirection: 'column' }}>
                <Text style={{ fontSize: 18, color: Theme.text, marginBottom: 8, opacity: 0.8 }}>Data that is collected by your wearable.</Text>
                <RoundButton title={'View sessions'} size='small' onPress={() => { router.navigate('sessions') }} />
            </View>
        </View>
    );
});