import * as React from 'react';
import { ActivityIndicator, Platform, ScrollView, Text, View } from 'react-native';
import { Theme } from '../../../../../theme';
import { useAppModel } from '../../../../../global';
import { useAtomValue } from 'jotai';
import { RoundButton } from '../../../../components/RoundButton';
import { DeviceComponent } from '../../../../components/DeviceComponent';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HappyError } from '../../../../../modules/errors/HappyError';
import { useRouter } from '../../../../../routing';

function inferVendorFromName(name: string): 'compass' | 'friend' | 'bubble' {
    if (name.toLowerCase().includes('compass')) return 'compass';
    if (name.toLowerCase().includes('friend')) return 'friend';
    return 'bubble';
}

const DiscoveryDevice = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const appModel = useAppModel();
    const router = useRouter();
    const discovery = useAtomValue(appModel.wearable.discoveryStatus);
    React.useEffect(() => {
        appModel.wearable.startDiscovery();
        return () => {
            appModel.wearable.stopDiscrovery();
        };
    }, []);
    const devices = discovery?.devices ?? [];
    devices.sort((a, b) => a.name.localeCompare(b.name));

    return (
        <View style={{ flexGrow: 1, backgroundColor: Theme.background }}>
            {devices.length === 0 && (
                <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', marginBottom: safeArea.bottom }}>
                    <ActivityIndicator />
                    <Text style={{ paddingHorizontal: 16, paddingVertical: 16, fontSize: 24, color: Theme.text }}>Looking for devices</Text>
                </View>
            )}
            {devices.length > 0 && (
                <>
                    <ScrollView style={{ flexGrow: 1, alignSelf: 'stretch' }} contentContainerStyle={{ padding: 16, paddingBottom: 128 + safeArea.bottom, justifyContent: 'center', flexGrow: 1, gap: 16 }} alwaysBounceVertical={false}>
                        <Text style={{ paddingHorizontal: 16, paddingVertical: 32, fontSize: 24, color: Theme.text, alignSelf: 'center' }}>{devices.length === 1 ? 'One device' : devices.length + ' devices'} found</Text>
                        {devices.map((device) => (
                            <DeviceComponent
                                key={device.id}
                                title={device.name}
                                kind={inferVendorFromName(device.name)}
                                subtitle={device.id}
                                action={async () => {
                                    let res = await appModel.wearable.tryPairDevice(device.id)
                                    if (res === 'connection-error') {
                                        throw new HappyError('Unable to connect to the device. Are you sure nothing is connected to it already?', false)
                                    } else if (res === 'unsupported') {
                                        throw new HappyError('It seesm that his device is not supported.', false)
                                    } else {
                                        router.goBack();
                                    }
                                }}
                            />
                        ))}
                    </ScrollView>
                </>
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

export default React.memo(() => {
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