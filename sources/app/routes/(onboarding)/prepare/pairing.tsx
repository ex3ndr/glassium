import * as React from 'react';
import { useRefresh } from '../_resolve';
import { ScrollView, Text, View } from 'react-native';
import { RoundButton } from '@/app/components/RoundButton';
import { Theme } from '@/app/theme';
import { markSkipPairing } from '@/global';
import { BluetoothService } from '@/modules/wearable/bluetooth/bt';
import { isDiscoveredDeviceSupported } from '@/modules/wearable/protocol/scan';
import { BTDiscoveredDevice } from '@/modules/wearable/bluetooth/types';
import LottieView from "lottie-react-native";
import { DeviceComponent } from '@/app/components/DeviceComponent';
import { inferVendorFromName } from '@/modules/wearable/protocol/inferVendorFromName';
import { resolveProtocol } from '@/modules/wearable/protocol/protocol';
import { loadDeviceProfile } from '@/modules/wearable/protocol/profile';
import { HappyError } from '@/modules/errors/HappyError';
import { WearableModule } from '@/modules/wearable/WearableModule';

export default React.memo(() => {
    const refresh = useRefresh();
    const [scanning, setScanning] = React.useState(false);
    const [devices, setDevices] = React.useState<BTDiscoveredDevice[]>([]);
    React.useEffect(() => {
        if (scanning) {
            BluetoothService.instance.startScan((d) => {
                if (isDiscoveredDeviceSupported(d)) {
                    setDevices((prev) => [...prev, d]);
                }
            });
            return () => {
                BluetoothService.instance.stopScan();
            }
        }
    }, [scanning]);
    const skip = React.useCallback(async () => {
        markSkipPairing();
        await refresh();
    }, []);

    const connect = async (device: BTDiscoveredDevice) => {

        // Connecting to device
        let connected = await BluetoothService.instance.connect(device.id, 5000);
        if (!connected) {
            throw new HappyError('Unable to connect to the device. Are you sure nothing is connected to it already?', false);
        }

        // Check protocols
        const protocol = await resolveProtocol(connected);
        if (!protocol) {
            connected.disconnect();
            throw new HappyError('It seesm that his device is not supported.', false)
        }

        // Check profile
        const profile = await loadDeviceProfile(protocol, connected);
        if (!profile) {
            connected.disconnect();
            throw new HappyError('It seesm that his device is not supported.', false)
        }

        // Persist device
        WearableModule.saveProfile(profile);

        // Reload
        await refresh();
    }

    return (
        <View style={{ flexGrow: 1, backgroundColor: Theme.background, justifyContent: 'center' }}>
            <Text style={{ color: Theme.text, fontSize: 32, alignSelf: 'center', textAlign: 'center', marginHorizontal: 32 }}>Connect to a device?</Text>
            <Text style={{ fontSize: 22, alignSelf: 'center', lineHeight: 30, color: Theme.text }}>Do you have an AI wearable?</Text>
            <View style={{ flexGrow: 1, maxHeight: 380, alignItems: 'center', justifyContent: 'center' }}>
                {!scanning && (
                    <LottieView style={{ width: 200, height: 200 }} source={require('@/app/assets/animation_speak.json')} autoPlay={true} />
                )}
                {scanning && devices.length === 0 && (
                    <LottieView style={{ width: 200, height: 200 }} source={require('@/app/assets/animation_eye.json')} autoPlay={true} />
                )}
                {scanning && devices.length > 0 && (
                    <ScrollView
                        style={{ alignSelf: 'stretch', flexGrow: 1, flexBasis: 0 }}
                        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 32, paddingVertical: 32 }}
                        alwaysBounceVertical={false}
                    >
                        {devices.map((v) => (
                            <DeviceComponent
                                key={v.id}
                                title={v.name}
                                subtitle={v.id}
                                kind={inferVendorFromName(v.name)}
                                action={async () => {
                                    await connect(v);
                                }}
                            />
                        ))}
                    </ScrollView>
                )}
            </View>
            <View style={{ height: 48, alignItems: 'center', justifyContent: 'center' }}>
                {!scanning && (
                    <RoundButton title={'Start Scan'} style={{ width: 250, alignSelf: 'center' }} onPress={() => setScanning(true)} />
                )}
                {/* {scanning && (
                    <Text style={{ color: Theme.text, fontSize: 22, fontWeight: '400' }}>Looking for devices</Text>
                )} */}
            </View>
            <RoundButton title={'Skip'} style={{ width: 250, alignSelf: 'center', marginTop: 16 }} display='inverted' action={skip} />
        </View >
    );
});