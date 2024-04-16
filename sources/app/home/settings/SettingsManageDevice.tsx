import * as React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Theme } from '../../../theme';
import { useAppModel } from '../../../global';
import { useAtomValue } from 'jotai';
import { RoundButton } from '../../components/RoundButton';

const DiscoveryDevice = React.memo(() => {
    const appModel = useAppModel();
    const discovery = useAtomValue(appModel.wearable.discoveryStatus);
    React.useEffect(() => {
        appModel.wearable.startDiscovery();
        return () => {
            appModel.wearable.stopDiscrovery();
        };
    }, []);
    const devices = discovery?.devices ?? [];

    return (
        <View style={{ flexGrow: 1, backgroundColor: Theme.background }}>
            <Text style={{ paddingHorizontal: 16, paddingVertical: 16, fontSize: 24 }}>Searching for devices</Text>
            {devices.length === 0 && (
                <View style={{ flexGrow: 1 }}>
                    <ActivityIndicator />
                </View>
            )}
            {devices.length > 0 && (
                <ScrollView style={{ flexGrow: 1, alignSelf: 'stretch' }} contentContainerStyle={{ padding: 16, paddingBottom: 128 }}>
                    {devices.map((device) => (
                        <RoundButton key={device.id} title={device.name} action={() => appModel.wearable.tryPairDevice(device.id)} />
                    ))}
                </ScrollView>
            )}
        </View>
    );
});

const ManageDevice = React.memo(() => {
    const appModel = useAppModel();
    return (
        <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.background }}>
            <RoundButton title={"Disconnect"} action={() => appModel.wearable.disconnectDevice()} />
        </View>
    )
});

export const SettingsManageDevice = React.memo(() => {
    const appModel = useAppModel();
    const wearable = appModel.useWearable();

    // Loading state
    if (wearable.pairing === 'loading' || wearable.pairing === 'denied' || wearable.pairing === 'unavailable') {
        return (
            <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.background }}>
                <ActivityIndicator />
            </View>
        );
    }

    // Need pairing
    if (wearable.pairing === 'need-pairing') {
        return <DiscoveryDevice />;
    }

    return (
        <ManageDevice />
    );
});