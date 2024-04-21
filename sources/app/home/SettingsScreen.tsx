import * as React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useRouter } from '../../routing';
import { Item } from '../components/Item';
import { useAppModel } from '../../global';
import { RoundButton } from '../components/RoundButton';
import { Theme } from '../../theme';
import { DeviceComponent } from '../components/DeviceComponent';
import { isDevMode, setDevMode } from '../../devmode';
import { randomQuote } from '../../modules/fun/randomQuote';
import * as Application from 'expo-application';
import * as Update from 'expo-updates';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const SettingsScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const appModel = useAppModel();
    const wearable = appModel.wearable.use();
    const router = useRouter();
    const updates = Update.useUpdates();
    const restartApp = async () => {
        await Update.reloadAsync();
    };
    const versionPresCount = React.useRef(0);
    const onVersionPress = () => {
        versionPresCount.current++;
        if (versionPresCount.current >= 10) {
            versionPresCount.current = 0;
            setDevMode(true);
            Update.reloadAsync();
        }
    };
    const quote = React.useMemo(() => randomQuote(), []);
    return (
        <View style={{ flexGrow: 1, paddingBottom: 64 + safeArea.bottom }}>
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
            {(isDevMode() || updates.isUpdatePending) && (
                <>
                    <View style={{ height: 16 }} />
                    <Item title={'Updates'} />
                    <View style={{ alignItems: 'flex-start', paddingHorizontal: 16, flexDirection: 'column' }}>
                        {updates.isChecking && (
                            <Text style={{ fontSize: 18, color: Theme.text, opacity: 0.8 }}>Checking for updates...</Text>
                        )}
                        {updates.isDownloading && (
                            <Text style={{ fontSize: 18, color: Theme.text, opacity: 0.8 }}>Downloading and update...</Text>
                        )}
                        {updates.isUpdatePending && (
                            <>
                                <Text style={{ fontSize: 18, color: Theme.text, marginBottom: 16, opacity: 0.8 }}>New update ready. Please, restart app to apply.</Text>
                                <RoundButton title={'Restart and update'} size='small' action={restartApp} />
                            </>
                        )}
                        {(!updates.isUpdatePending && !updates.isDownloading && !updates.isChecking) && (
                            <Text style={{ fontSize: 18, color: Theme.text, opacity: 0.8 }}>Bubble is up-to-date.</Text>
                        )}
                    </View>
                </>
            )}
            {isDevMode() && (
                <>
                    <View style={{ height: 16 }} />
                    <Item title="Developer Mode" />
                    <View style={{ alignItems: 'flex-start', paddingHorizontal: 16, flexDirection: 'column' }}>
                        <Text style={{ fontSize: 18, color: Theme.text, marginBottom: 16, opacity: 0.8 }}>{quote.text}{'\n\n'}<Text style={{ fontStyle: 'italic' }}>{quote.from}</Text></Text>
                        <RoundButton title={'Restart app'} size='small' action={restartApp} />
                    </View>
                </>
            )}

            <View style={{ flexGrow: 1 }} />
            <Pressable onPress={onVersionPress}>
                <Text style={{ color: Theme.textSecondary, paddingHorizontal: 16, paddingVertical: 16, alignSelf: 'center' }}>{Application.applicationName} v{Application.nativeApplicationVersion} ({Application.nativeBuildVersion})</Text>
            </Pressable>
        </View>
    );
});