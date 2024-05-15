import * as React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router, useNavigationContainerRef, usePathname } from 'expo-router';
import { Platform, Pressable, Text, View } from 'react-native';
import * as Updates from 'expo-updates'
import { useLayout } from "@/utils/useLayout";
import { Theme } from '@/app/theme';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banner } from '@/app/components/Banner';
import { useAppModel } from '@/global';
import { DeviceStateView } from '@/app/components/DeviceStateView';
import { useDeviceState } from '@/app/components/useDeviceState';
import { BatteryComponent } from '@/app/components/BatteryComponent';

//
// Navigation
//

export const Sidebar = () => {
    const layout = useLayout();
    const safeArea = useSafeAreaInsets();
    const deviceState = useDeviceState();
    return (
        <View style={{ alignSelf: 'stretch', marginHorizontal: 16, gap: 4, flexGrow: 1, paddingTop: safeArea.top, paddingBottom: safeArea.bottom }}>

            {/* Show nice logo in sidebar only when sidebar is always visible */}
            {layout === 'large' && (
                <View style={{ height: 64, alignItems: 'center', flexDirection: 'row', marginLeft: 8, marginTop: 2 }}>
                    <Image source={require('@/app/assets/splash_2.png')} style={{ width: 24, height: 24 }} />
                    <Text style={{ color: Theme.text, marginLeft: 12, fontSize: 24 }}>Glassium</Text>
                </View>
            )}

            {/* Top padding for mobile screens */}
            {layout === 'small' && (
                <View style={{ height: Platform.select({ default: 44, 'android': 56, web: 56 }) }} />
            )}

            {/* Sidebar buttons */}
            <SidebarButton icon="home-outline" title='Home' pathname='/' internal="index" />
            {layout === 'large' && (
                <SidebarButton icon="document-text-outline" title='Transcripts' pathname='/data/transcripts' internal="data/transcripts/index" />
            )}
            <SidebarButton icon="cog" title='Settings' pathname='/settings' internal='settings/index' />
            <View style={{ flexGrow: 1 }} />

            {/* Show device state only when explicitly paired on large devices */}
            {layout === 'large' && deviceState && deviceState.paired && (
                <View style={{ marginBottom: 16 }}>
                    <DeviceStateView state={deviceState} />
                </View>
            )}
            {/* <View style={{ marginBottom: 16 }}>
                <DeviceStateView state={deviceState} />
            </View> */}
        </View>
    );
};

export const HomeHeader = () => {
    const layout = useLayout();
    const device = useDeviceState();
    return (
        <Stack.Screen
            options={{
                // headerShown: layout === 'small', // We don't show header in home on large screen
                title: layout === 'small' ? 'Glassium' : 'Home',
                headerRight: () => <DeviceHedaerControls />,
            }}
        />
    );
}

export const HomeTopBar = () => {
    const layout = useLayout();
    return (
        <View style={{ paddingTop: 8, gap: 8 }}>
            <UpdateBanner />
            <VoiceSampleBanner />
            {layout === 'small' && (
                <>
                    {/* <AIStatusComponent small={false} /> */}
                    <Pressable
                        style={(p) => ({
                            backgroundColor: p.pressed ? '#131313' : '#1d1d1d',
                            borderRadius: 16,
                            paddingHorizontal: 16,
                            paddingVertical: 16,
                            flexDirection: 'row'
                        })}
                        onPress={() => router.navigate('/data/transcripts')}
                    >
                        <Text style={{ color: Theme.text, fontSize: 18 }}>View transcripts</Text>
                    </Pressable>
                </>
            )}
        </View>
    )
};

//
// Components
//

const SidebarButton = (props: { icon: string, title: string, pathname: string, internal: string }) => {
    const pathName = usePathname();
    const navigation = useNavigationContainerRef();
    function doNavigate() {

        // Try to find the existing key for (app) and (screens) routes
        let state = navigation.getState();
        let appKey: string | undefined = undefined;
        let screensKey: string | undefined = undefined;
        if (state.routes.length > 0 && state.routes[0].name === '(app)') {
            appKey = state.routes[0].key;
            if (state.routes[0].state && state.routes[0].state.routes.length > 0 && state.routes[0].state.routes[0].name === '(screens)') {
                screensKey = state.routes[0].state.routes[0].key;
            }
        }

        // Navigate to the new route
        navigation.reset({
            routes: [{
                name: '(app)',
                key: appKey,
                state: {
                    history: [],
                    routes: [{
                        name: '(screens)',
                        key: screensKey,
                        state: {
                            routes: [{ name: props.internal, path: pathName }]
                        }
                    }]
                }
            }]
        });
    }
    return (
        <Pressable
            style={(p) => ({
                backgroundColor: pathName === props.pathname ? 'rgba(255, 255, 255, 0.1)' : (((p as any).hovered || p.pressed) ? 'rgba(255, 255, 255, 0.05)' : 'transparent'),
                borderRadius: 10,
                paddingHorizontal: 16,
                height: 48,
                flexDirection: 'row',
                alignItems: 'center',
            })}
            onPress={doNavigate}
        >
            <Ionicons name={props.icon as any} size={18} color={Theme.text} />
            <Text style={{ color: Theme.text, fontSize: 18, marginLeft: 8, lineHeight: 22 }}>{props.title}</Text>
        </Pressable>
    )
};

// const AIStatusComponent = React.memo((props: { small: boolean }) => {
//     const app = useAppModel();
//     const state = useDeviceState();
//     const doPair = async () => {
//         if (app.wearable.bluetooth.supportsScan) {
//             router.navigate('manage-device')
//         } else if (app.wearable.bluetooth.supportsPick) {
//             await app.wearable.pick();
//         }
//     };
//     const doOpenSettings = () => {
//         router.navigate('settings')
//     }

//     if (state === 'denied' && Platform.OS !== 'web') {
//         return (<Banner title={texts.bt_denied.title} text={props.small ? texts.bt_denied.message_small : texts.bt_denied.message} kind="warning" onPress={openSystemSettings} small={props.small} />);
//     }
//     // if (state === 'unavailable' && !props.small) {
//     //     return (<Banner title={texts.bt_unavailable.title} text={texts.bt_unavailable.message} kind="warning" onPress={openSystemSettings} small={props.small} />);
//     // }
//     if (state === 'pairing') {
//         return (<Banner title={texts.bt_pairing.title} text={props.small ? texts.bt_pairing.message_small : texts.bt_pairing.message} kind="alert" onPress={doPair} small={props.small} />);
//     }

//     // Everyday statuses
//     // if (state === 'offline') {
//     //     return (<Banner title='Offline' text='Connection to AI is lost. Processing will resume on reconnection.' kind="normal" fixedSize={true} />);
//     // }
//     if (state === 'disconnected') {
//         return (<Banner title={texts.bt_disconnected.title} text={props.small ? texts.bt_disconnected.message_small : texts.bt_disconnected.message} kind="normal" fixedSize={true} onPress={doOpenSettings} small={props.small} />);
//     }
//     if (state === 'online') {
//         return <Banner title={texts.bt_online.title} text={props.small ? texts.bt_online.message_small : texts.bt_online.message} kind="normal" fixedSize={true} onPress={doOpenSettings} small={props.small} />;
//     }

//     // Unknown
//     return null;
// });

const UpdateBanner = () => {
    const updates = Updates.useUpdates();
    const hasUpdate = updates.isUpdatePending && Platform.OS !== 'web';
    // const hasUpdate = true;
    if (hasUpdate) {
        return (<Banner title='New version available!' text="Press to restart app to apply update" kind="alert" onPress={() => Updates.reloadAsync()} />);
    }
    return null;
}

const VoiceSampleBanner = () => {
    const app = useAppModel();
    const me = app.profile.use();
    const needVoiceSample = me && !me.voiceSample;

    if (needVoiceSample) {
        return (
            <Banner title="Voice sample needed" text="To improve AI experience, please, record a voice sample" kind="normal" onPress={() => router.navigate('/settings/voice')} />
        );
    }

    return null;
};

const DeviceHedaerControls = React.memo(() => {
    const app = useAppModel();
    const device = useDeviceState();
    if (device.paired && device.battery !== undefined) {
        return <BatteryComponent level={device.battery} />;
    }
    return null;
});