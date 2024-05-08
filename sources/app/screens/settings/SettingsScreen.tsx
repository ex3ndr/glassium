import * as React from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from '../../../routing';
import { Item } from '../../components/Item';
import { useAppModel } from '../../../global';
import { RoundButton } from '../../components/RoundButton';
import { Theme } from '../../../theme';
import { DeviceComponent } from '../../components/DeviceComponent';
import { isDevMode, setDevMode } from '../../../devmode';
import { randomQuote } from '../../../modules/fun/randomQuote';
import * as Application from 'expo-application';
import * as Update from 'expo-updates';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { alert } from '../../helpers/alert';
import { cleanAndReload } from '../../../modules/reload/cleanAndReload';

export const SettingsScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const appModel = useAppModel();
    const wearable = appModel.wearable.use();
    const router = useRouter();
    const updates = Update.useUpdates();
    const profile = appModel.profile.use();
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
    const deleteAction = async () => {

        // Confirm
        let res = await alert('Are you sure?', 'This action will delete your account and all associated data.', [{ text: 'Delete', style: 'destructive' }, { text: 'Cancel', style: 'cancel' }]);
        if (res !== 0) {
            return;
        }

        // Delete
        await appModel.client.accountDelete();

        // Reset app
        await cleanAndReload();
    };
    const logoutAction = async () => {

        // Confirm
        let res = await alert('Are you sure?', 'You will need to login again to get an access to your memories.', [{ text: 'Logout', style: 'destructive' }, { text: 'Cancel', style: 'cancel' }]);
        if (res !== 0) {
            return;
        }

        // Reset app
        await cleanAndReload();
    };
    const doPair = async () => {
        if (appModel.wearable.bluetooth.supportsScan) {
            router.navigate('manage-device')
        } else if (appModel.wearable.bluetooth.supportsPick) {
            await appModel.wearable.pick();
        }
    };

    const quote = React.useMemo(() => randomQuote(), []);
    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 64 + safeArea.bottom }} alwaysBounceVertical={false} style={{ backgroundColor: Theme.background }}>
            <Item title="Profile" />
            {!profile && (
                <View style={{ alignItems: 'flex-start', paddingHorizontal: 16, flexDirection: 'column' }}>
                    <ActivityIndicator />
                </View>
            )}
            {!!profile && (
                <View style={{ alignItems: 'flex-start', paddingHorizontal: 16, flexDirection: 'column' }}>
                    <Text style={{ fontSize: 18, color: Theme.text, marginBottom: 8, opacity: 0.8 }}>@{profile.username} <Text style={{ opacity: 0.4 }}>{profile.firstName} {profile.lastName}</Text></Text>
                    <Text style={{ fontSize: 18, color: Theme.text, marginBottom: 8, opacity: 0.8 }}>{profile.phone}</Text>
                </View>
            )}
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
                    <RoundButton title={'Pair new device'} size='small' action={doPair} />
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
            {(isDevMode() || updates.isUpdatePending) && (Platform.OS !== 'web') && (
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
                        <RoundButton title={'Open developer tools'} size='small' onPress={() => router.navigate('dev')} />
                    </View>
                </>
            )}
            <View style={{ height: 16 }} />
            <Item title="Account" />
            <View style={{ alignItems: 'flex-start', paddingHorizontal: 16, flexDirection: 'column' }}>
                <Text style={{ fontSize: 18, color: Theme.text, marginBottom: 8, opacity: 0.8 }}>Managing your account and associated data.</Text>
                <View style={{ gap: 16 }}>
                    <RoundButton title={'Logout Account'} size='small' action={logoutAction} />
                    <RoundButton title={'Delete Account'} size='small' action={deleteAction} />
                </View>
            </View>

            <View style={{ flexGrow: 1 }} />
            <Pressable onPress={onVersionPress}>
                <Text style={{ color: Theme.textSecondary, paddingHorizontal: 16, paddingVertical: 16, alignSelf: 'center' }}>
                    {Platform.OS === 'web' ? 'Web Client' : `${Application.applicationName} v${Application.nativeApplicationVersion} (${Application.nativeBuildVersion})`}
                </Text>
            </Pressable>
        </ScrollView>
    );
});