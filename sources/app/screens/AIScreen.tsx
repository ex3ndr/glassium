import * as React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Banner } from './components/Banner';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppModel } from '../../global';
import { useRouter } from '../../routing';
import { Theme } from '../../theme';
import { Image } from 'expo-image';
import { Memory } from '../../modules/api/schema';
import { InvalidateSync } from '../../utils/sync';
import { FlashList } from '@shopify/flash-list';
import { Feed } from '../feed/Feed';

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
});

function useMemories() {
    const app = useAppModel();
    const [list, setList] = React.useState<Memory[] | null>(null);
    React.useEffect(() => {
        let exited = false;
        let sync = new InvalidateSync(async () => {
            if (exited) {
                return;
            }
            let memories = await app.client.getMemories();
            if (exited) {
                return;
            }
            setList(memories);
        });
        sync.invalidate();
        let inteval = setInterval(() => {
            sync.invalidate();
        }, 5000);
        return () => {
            exited = true;
            clearInterval(inteval);
        };
    }, []);
    return list;
}

const MemoryComponent = React.memo((props: { memory: Memory }) => {
    const router = useRouter();

    let image;
    if (props.memory.image && props.memory.imageMetadata) {
        image = (
            <Image
                source={{ uri: props.memory.image }}
                placeholder={{ thumbhash: props.memory.imageMetadata.thumbhash }}
                style={{ width: 'auto', height: 'auto', aspectRatio: props.memory.imageMetadata.width / props.memory.imageMetadata.height, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}

            />
        )
    } else {
        image = <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Theme.warninig }} />
    }

    return (
        <Pressable key={props.memory.id} style={{ marginHorizontal: 16, marginVertical: 16, borderRadius: 16, borderWidth: 0.5, borderColor: '#272727', flexDirection: 'column' }} onPress={() => router.navigate('memory', { id: props.memory.id })}>
            {image}
            <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0, paddingTop: 8, paddingHorizontal: 8, paddingBottom: 16, backgroundColor: 'white', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
                <Text style={{ fontSize: 16, color: Theme.textInverted }} numberOfLines={3}>{props.memory.title}</Text>
                <Text style={{ fontSize: 14, opacity: 0.6, color: Theme.textInverted }} numberOfLines={2}>{props.memory.summary.replaceAll('\n', ' ')}</Text>
            </View>
        </Pressable>
    );
});

export const AIScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const app = useAppModel();
    const router = useRouter();

    // Views
    const header = (
        <>
            <AIStatusComponent />
            <Pressable
                style={(p) => ({
                    backgroundColor: p.pressed ? '#131313' : '#1d1d1d',
                    borderRadius: 16,
                    marginHorizontal: 16,
                    marginVertical: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    flexDirection: 'row'
                })}
                onPress={() => router.navigate('transcriptions')}
            >
                <Text style={{ color: Theme.text, fontSize: 18 }}>View transcripts</Text>
            </Pressable>
            {/* <Text style={{ fontSize: 18, color: Theme.text, paddingHorizontal: 32, marginTop: 16, fontWeight: '700' }}>Chats</Text>
            <Pressable
                style={(p) => ({
                    backgroundColor: p.pressed ? '#131313' : '#1d1d1d',
                    borderRadius: 16,
                    marginHorizontal: 16,
                    marginVertical: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    height: 90,
                    flexDirection: 'row'
                })}
                onPress={() => router.navigate('chat', { id: 'ai' })}
            >
                <Image
                    source={{ uri: 'https://picsum.photos/200/300' }}
                    style={{ width: 60, height: 60, borderRadius: 30 }}
                />
                <View style={{ flexDirection: 'column', marginLeft: 16, justifyContent: 'center' }}>
                    <Text style={{ color: Theme.text, fontSize: 18 }} numberOfLines={1}>Bubble AI Assistant</Text>
                    <Text style={{ color: Theme.text, fontSize: 16, opacity: 0.8 }} numberOfLines={1}>Tap to start a new chat</Text>
                </View>
            </Pressable> */}
            <Text style={{ fontSize: 18, color: Theme.text, paddingHorizontal: 32, marginTop: 16, fontWeight: '700' }}>Moments</Text>
        </>
    );
    const footer = (loading: boolean) => {
        return (
            <View style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 8, height: 64, marginBottom: safeArea.bottom, flexDirection: 'column' }}>
                {loading && (<ActivityIndicator />)}
                {!loading && <Text style={{ color: Theme.text, opacity: 0.7 }}>The end.</Text>}
            </View>
        )
    }
    const empty = (
        <ScrollView style={{ flex: 1 }} alwaysBounceVertical={false}>
            {header}
            <Text style={{ fontSize: 16, color: Theme.text, paddingHorizontal: 32, opacity: 0.7, marginVertical: 8 }}>Moments will appear here once AI find something interesting</Text>
            <View style={{ height: safeArea.bottom + 16 }} />
        </ScrollView>
    );
    const loading = (
        <ScrollView style={{ flex: 1 }} alwaysBounceVertical={false}>
            {header}
            <ActivityIndicator />
            <View style={{ height: safeArea.bottom + 16 }} />
        </ScrollView>
    );
    return (
        <Feed
            feed='smart'
            display='large'
            header={() => header}
            footer={footer}
            empty={empty}
            loading={loading}
        />
    );
});