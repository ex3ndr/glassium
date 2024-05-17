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
    const app = useAppModel();
    const layout = useLayout();
    const safeArea = useSafeAreaInsets();
    const deviceState = useDeviceState();
    const dev = app.profile.useDeveloperMode();
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
            {dev && (
                <SidebarButton icon="cog" title='Developer' pathname='/dev' internal='dev/index' />
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

export const HomeTopBar = () => {
    const layout = useLayout();
    return (
        <>
            <UpdateBanner />
            {/* <VoiceSampleBanner /> */}
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
        </>
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
            <View style={{ width: 18, height: 18 }}>
                <Ionicons name={props.icon as any} size={18} color={Theme.text} />
            </View>
            <Text style={{ color: Theme.text, fontSize: 18, marginLeft: 8, lineHeight: 22 }}>{props.title}</Text>
        </Pressable>
    )
};

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

//
// Home header
//

export const HomeHeader = () => {
    const layout = useLayout();
    const device = useDeviceState();
    return (
        <Stack.Screen
            options={{
                headerShown: layout === 'small', // We don't show header in home on large screen
                // title: layout === 'small' ? 'Glassium' : 'Home',
                headerTitle: () => <DeviceHeaderView />,
                headerRight: () => <DeviceHedaerControls />,
            }}
        />
    );
}

const DeviceHeaderView = React.memo(() => {
    const layout = useLayout();
    const deviceState = useDeviceState();
    if (layout === 'large') {
        return (
            <Text style={{ color: Theme.text, fontSize: 21 }}>Home</Text>
        );
    }

    let subtitle: string | null = 'idle';
    if (deviceState.paired) {
        if (deviceState.state === 'connected') {
            if (deviceState.muted !== undefined && deviceState.muted || deviceState.softMuted) {
                subtitle = 'muted';
            } else {
                if (deviceState.voice) {
                    subtitle = 'voice detected';
                } else {
                    subtitle = 'listening';
                }
            }
        } else if (deviceState.state === 'connecting') {
            subtitle = 'connecting';
        } else if (deviceState.state === 'denied') {
            subtitle = 'bluetooth disabled';
        } else if (deviceState.state === 'unavailable') {
            subtitle = null;
        }
    } else {
        if (deviceState.state === 'denied') {
            subtitle = 'bluetooth disabled';
        } else if (deviceState.state === 'unavailable') {
            subtitle = null;
        } else {
            subtitle = 'no device';
        }
    }

    return (
        <View style={{ flexDirection: 'column', alignItems: Platform.OS === 'ios' ? 'center' : 'flex-start' }}>
            <Text style={{ color: Theme.text, fontSize: 20, fontWeight: '600' }}>Glassium</Text>
            {subtitle && (
                <View style={{ flexDirection: 'row' }}>
                    <Text style={[{ color: Theme.text, fontSize: 14, fontWeight: '500', opacity: 0.5, marginTop: -3 }]}>
                        {subtitle}
                    </Text>
                </View>
            )}
        </View>
    );
});

const DeviceHedaerControls = React.memo(() => {
    const layout = useLayout();
    const app = useAppModel();
    const device = useDeviceState();
    if (layout === 'large') {
        return null;
    }
    let components: any[] = [];
    if (device.paired && device.battery !== undefined) {
        components.push(<BatteryComponent level={device.battery} />);
    }
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {components}
        </View>
    );
});