import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Banner } from './components/Banner';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppModel } from '../../global';
import { useRouter } from '../../routing';
import { RoundButton } from '../components/RoundButton';
import { Theme } from '../../theme';
import { Image } from 'expo-image';

const AIStatusComponent = React.memo(() => {
    const app = useAppModel();
    const wearable = app.wearable.use();
    const router = useRouter();
    const doPair = async () => {
        if (app.wearable.bluetooth.supportsScan) {
            router.navigate('manage-device')
        } else if (app.wearable.bluetooth.supportsPick) {
            await app.wearable.pick();
        }
    };
    let state: 'online' | 'offline' | 'disconnected' | 'denied' | 'unavailable' | 'pairing' | 'unknown' = 'unknown';
    if (wearable.pairing === 'denied') {
        state = 'denied';
    } else if (wearable.pairing === 'unavailable') {
        state = 'unavailable';
    } else if (wearable.pairing === 'need-pairing') {
        state = 'pairing';
    } else if (wearable.device) {
        if (wearable.device.status === 'connected' || wearable.device.status === 'subscribed') {
            state = 'online';
        } else if (wearable.device.status === 'connecting' || wearable.device.status === 'disconnected') {
            state = 'disconnected';
        }
    }

    if (state === 'denied') {
        return (<Banner title='Bluetooth permission' text="Bubble needs a bluetooth permission to connect to your device. Please, open settings and allow bluetooth for this app." kind="warning" />);
    }
    if (state === 'unavailable') {
        return (<Banner title='Bluetooth unavailable' text="Unfortunatelly this device doesn't have a bluetooth and Bubble can't connect to any device." kind="warning" />);
    }
    if (state === 'pairing') {
        return (<Banner title='Pairing needed' text="Press to connect a new device to allow AI start collection of experiences around you" kind="alert" />);
    }

    // Everyday statuses
    // if (state === 'offline') {
    //     return (<Banner title='Offline' text='Connection to AI is lost. Processing will resume on reconnection.' kind="normal" fixedSize={true} />);
    // }
    if (state === 'disconnected') {
        return (<Banner title='Disconnected' text='Device disconnected. Some experiences may be lost.' kind="normal" fixedSize={true} />);
    }
    if (state === 'online') {
        return <Banner title='Online' text='AI is connected to your device and collects experiences around you.' kind="normal" fixedSize={true} />;
    }

    // Unknown
    return null;
})

export const AIScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    return (
        <ScrollView
            style={{ flex: 1, marginBottom: 64 + safeArea.bottom }}
            alwaysBounceVertical={false}
        >
            <AIStatusComponent />
            {/* <Banner title='Confirmations' text="AI doesn't have anything to confirm from you." kind='normal' /> */}
            <Text style={{ fontSize: 18, color: Theme.text, paddingHorizontal: 32, marginTop: 16, fontWeight: '700' }}>Chats</Text>
            <Pressable style={(p) => ({ backgroundColor: p.pressed ? '#131313' : '#1d1d1d', borderRadius: 16, marginHorizontal: 16, marginVertical: 8, paddingHorizontal: 16, paddingVertical: 16, height: 90, flexDirection: 'row' })}>
                <Image
                    source={{ uri: 'https://picsum.photos/200/300' }}
                    style={{ width: 60, height: 60, borderRadius: 30 }}
                />
                <View style={{ flexDirection: 'column', marginLeft: 16, justifyContent: 'center' }}>
                    <Text style={{ color: Theme.text, fontSize: 18 }} numberOfLines={1}>Bubble AI Assistant</Text>
                    <Text style={{ color: Theme.text, fontSize: 16, opacity: 0.8 }} numberOfLines={1}>Tap to start a new chat</Text>
                </View>
            </Pressable>
        </ScrollView>
    );
});