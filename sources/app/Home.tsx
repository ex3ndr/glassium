import * as React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RoundButton } from './components/RoundButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../theme';
import { useAppModel } from '../global';
import { useRouter } from '../routing';
import { Ionicons } from '@expo/vector-icons';
import { useAtomValue } from 'jotai';
import { TopBar } from './home/TopBar';

export const HomeScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const appModel = useAppModel();
    const sessions = appModel.useSessions();
    const router = useRouter();
    return (
        <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingTop: safeArea.top, backgroundColor: Theme.background }}>
            <TopBar />
            {sessions === null && (
                <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: safeArea.bottom, }}>
                    <ActivityIndicator size="large" color={Theme.accent} />
                </View>
            )}
            {sessions !== null && sessions.length === 0 && (
                <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom, }}>
                    <Text>Press record button to start!</Text>
                </View>
            )}
            {sessions !== null && sessions.length > 0 && (
                <ScrollView style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }} contentContainerStyle={{ alignItems: 'stretch', paddingBottom: safeArea.bottom + 64 }}>
                    {sessions.map((session) => (
                        <Pressable
                            key={session.id}
                            style={{
                                backgroundColor: '#eee',
                                marginHorizontal: 16,
                                marginVertical: 8,
                                borderRadius: 16,
                                paddingHorizontal: 16,
                                paddingVertical: 18,
                                flexDirection: 'row'
                            }}
                            onPress={() => { router.navigate('session', { id: session.id }) }}
                        >
                            <Text style={{ color: 'black', fontSize: 24, flexGrow: 1, flexBasis: 0, alignSelf: 'center' }}>Session #{(session.index + 1)}</Text>
                            <Text style={{ color: 'black', alignSelf: 'center' }}>{session.state}</Text>
                            <Text>{session.audio ? (session.audio.duration / 1000).toString() : ''}</Text>
                        </Pressable>
                    ))}
                </ScrollView>
            )}

            <View style={[styles.bottomBar, { height: 64 + safeArea.bottom, paddingBottom: safeArea.bottom }]}>
                <BottomPanel />
            </View>
        </View>
    );
});

const BottomPanel = React.memo(() => {
    const appModel = useAppModel();
    const wearable = appModel.useWearable();
    const capture = useAtomValue(appModel.capture.captureState);
    const router = useRouter();
    const doOpenPairing = () => {
        // Need to reset discovered devices before opening the pairing screent to avoid showing old devices
        appModel.wearable.resetDiscoveredDevices();
        router.navigate('pairing');
    };

    // Basic pairing statuses
    if (wearable.pairing === 'loading') {
        return <ActivityIndicator size="small" color={Theme.accent} />
    }
    if (wearable.pairing === 'need-pairing') {
        return <RoundButton title="Pair new device" onPress={doOpenPairing} />
    }
    if (wearable.pairing === 'denied') {
        return <Text>Bluetooth permission denied</Text>
    }
    if (wearable.pairing === 'unavailable') {
        return <Text>Bluetooth unavailable</Text>
    }

    // Handle ready state
    let isConnected = wearable.device !== 'connecting';
    return (
        <View style={{ flexGrow: 1, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flexGrow: 1, flexBasis: 0, paddingLeft: 32 }}>
                {capture && capture.streaming && (
                    <Text>Recording...</Text>
                )}
                {capture && !capture.streaming && (
                    <Text><Ionicons name="warning-outline" size={18} color="black" />Connecting</Text>
                )}
            </View>
            <View style={{}}>
                {!!capture && (
                    <RoundButton title="Stop" onPress={() => appModel.capture.stop()} />
                )}
                {!capture && (
                    <RoundButton title="Start" onPress={() => appModel.capture.start()} />
                )}
            </View>
            <View style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'row', justifyContent: 'flex-end', paddingRight: 32 }}>

            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    bottomBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white'
    }
});