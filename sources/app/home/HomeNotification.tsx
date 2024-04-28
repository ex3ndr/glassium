import * as React from 'react';
import { useAppModel } from '../../global';
import { Platform, Text, View } from 'react-native';
import { Theme } from '../../theme';
import { RoundButton } from '../components/RoundButton';
import { openSystemSettings } from '../../utils/openSystemSettings';
import { useRouter } from '../../routing';

const NotifcationComponent = React.memo((props: { title: string, text: string, actionTitle?: string, action?: () => Promise<any> }) => {
    return (
        <View style={{ backgroundColor: '#941df6', borderRadius: 32, marginHorizontal: 16, marginVertical: 8, paddingHorizontal: 16, paddingVertical: 16 }}>
            <Text style={{ color: Theme.text, fontSize: 14, fontWeight: '600', opacity: 0.7 }}>{props.title}</Text>
            <Text style={{ color: Theme.text, fontSize: 18 }}>{props.text}</Text>
            {props.actionTitle && (
                <View style={{ alignItems: 'flex-start', marginTop: 8 }}>
                    <RoundButton title={props.actionTitle} size='small' action={props.action} />
                </View>
            )}
        </View>
    )
});

export const HomeNotification = React.memo(() => {
    const app = useAppModel();
    const wearable = app.wearable.use();
    const router = useRouter();
    const doPair = async () => {
        if (app.wearable.bluetooth.supportsScan) {
            router.navigate('manage-device')
        } else if (app.wearable.bluetooth.supportsPick) {
            let picked = await app.wearable.bluetooth.pick();
            if (picked) {
                await app.wearable.tryPairDevice(picked.id);
            }
        }
    };

    if (wearable.pairing === 'denied') {
        return <NotifcationComponent title="Bluetooth needed" text='Bubble needs a bluetooth permission to connect to your device. Please, open settings and allow bluetooth for this app.' actionTitle='Open Settings' action={openSystemSettings} />;
    }
    if (wearable.pairing === 'unavailable') {
        return <NotifcationComponent title="Bluetooth needed" text="Unfortunatelly this device doesn't have a bluetooth and Bubble can't connect to any device." />;
    }
    if (wearable.pairing === 'need-pairing') {
        return <NotifcationComponent title="Pairing needed" text="Please, pair a new device to continue collection information about you." actionTitle='Pair New Device' action={doPair} />;
    }
    return null;
});