import * as React from 'react';
import { Text, View } from 'react-native';
import { Theme } from '../../../theme';
import { RoundButton } from '../../components/RoundButton';
import { Audio } from 'expo-av';
import { useHappyAction } from '../../helpers/useHappyAction';
import { openSystemSettings } from '../../../utils/openSystemSettings';
import * as Haptics from 'expo-haptics';
import { delay } from '../../../utils/time';
import { useRouter } from '../../../routing';
import { useAppModel } from '../../../global';
import { Image } from 'expo-image';

export const VoiceSampleScreen = React.memo(() => {

    const app = useAppModel();
    const router = useRouter();
    const [state, setState] = React.useState<string>('');
    const [executing, action] = useHappyAction(async () => {

        // Check permission
        let permission = await Audio.getPermissionsAsync();

        // Request permission
        if (permission.status === 'undetermined') {
            permission = await Audio.requestPermissionsAsync();
        }

        // Handle denied
        if (permission.status === 'denied') {
            setState('Access to microphone denied');
            await openSystemSettings();
            return;
        }

        try {

            // Count down
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setState('Prepare in 3s...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setState('Prepare in 2s...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setState('Prepare in 1s...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Start
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setState('Recording...');
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            await delay(5000);
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI()!;
            console.log('Recording URI:', uri);

            // Verification
            setState('Uploading...');
            await app.profile.uploadVoiceSample(uri);

            // Success
            setState('Success!');
            await delay(1000);
            router.goBack();
        } catch (e) {
            setState('Error during recording');
        }
    });

    return (
        <View style={{ flexGrow: 1, backgroundColor: Theme.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
            <Image source={require('../../assets/singer_3d_default.png')} style={{ width: 200, height: 200, marginBottom: 32 }} />
            <Text style={{ color: Theme.text, fontSize: 22, alignSelf: 'center', lineHeight: 30, textAlign: 'center', marginBottom: 48 }}>To improve performance, {'\n'}AI need 5 seconds of your voice</Text>
            <Text style={{ color: Theme.text, fontSize: 20, marginBottom: 48, height: 24 }} numberOfLines={1}>{state}</Text>
            <RoundButton title='Record voice sample' onPress={action} loading={executing} />
        </View>
    );
});