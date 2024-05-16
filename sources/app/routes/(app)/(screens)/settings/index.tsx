import * as React from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import * as Application from 'expo-application';
import * as Update from 'expo-updates';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppModel } from '@/global';
import { isDevMode, setDevMode } from '@/devmode';
import { useAlert } from '@/app/libs/alert';
import { cleanAndReload } from '@/modules/reload/cleanAndReload';
import { randomQuote } from '@/app/libs/quotes';
import { Item } from '@/app/components/Item';
import { Theme } from '@/app/theme';
import { RoundButton } from '@/app/components/RoundButton';
import { DeviceStateView } from '@/app/components/DeviceStateView';
import { useDeviceState } from '@/app/components/useDeviceState';

export default React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const appModel = useAppModel();
    const updates = Update.useUpdates();
    const profile = appModel.profile.use();
    const deviceState = useDeviceState();
    const alert = useAlert();
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
                <View style={{ alignItems: 'flex-start', paddingHorizontal: 16, marginBottom: 16, flexDirection: 'column' }}>
                    <Text style={{ fontSize: 18, color: Theme.text, marginBottom: 8, opacity: 0.8 }}>@{profile.username} <Text style={{ opacity: 0.4 }}>{profile.firstName} {profile.lastName}</Text></Text>
                    <RoundButton title={'Manage account'} size='small' onPress={() => { router.navigate('/settings/account') }} />
                </View>
            )}
            <Item title="Device" />
            <View style={{ marginHorizontal: 16, marginTop: 8 }}>
                <DeviceStateView state={deviceState} />
            </View>
            <View style={{ height: 16 }} />
            <Item title="Data" />
            <View style={{ alignItems: 'flex-start', paddingHorizontal: 16, flexDirection: 'column' }}>
                <Text style={{ fontSize: 18, color: Theme.text, marginBottom: 8, opacity: 0.8 }}>Data that is collected by your wearable.</Text>
                <RoundButton title={'View sessions'} size='small' onPress={() => { router.navigate('/data/sessions') }} />
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
                            <Text style={{ fontSize: 18, color: Theme.text, opacity: 0.8 }}>Glassium is up-to-date.</Text>
                        )}
                    </View>
                </>
            )}
            {isDevMode() && (
                <>
                    <View style={{ height: 16 }} />
                    <Item title="Debug Tools" />
                    <View style={{ alignItems: 'flex-start', paddingHorizontal: 16, flexDirection: 'column' }}>
                        <Text style={{ fontSize: 18, color: Theme.text, marginBottom: 16, opacity: 0.8 }}>{quote.text}{'\n\n'}<Text style={{ fontStyle: 'italic' }}>{quote.from}</Text></Text>
                        <RoundButton title={'Open debug tools'} size='small' onPress={() => router.navigate('/debug')} />
                    </View>
                </>
            )}

            <View style={{ flexGrow: 1 }} />
            <Pressable onPress={onVersionPress}>
                <Text style={{ color: Theme.textSecondary, paddingHorizontal: 16, paddingVertical: 16, alignSelf: 'center' }}>
                    {Platform.OS === 'web' ? 'Web Client' : `${Application.applicationName} v${Application.nativeApplicationVersion} (${Application.nativeBuildVersion})`}
                </Text>
            </Pressable>
        </ScrollView>
    );
});