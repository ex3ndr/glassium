import { BackendClient } from '@/modules/api/client';
import { openSystemSettings } from '@/utils/openSystemSettings';
import { useHappyAction } from '@/utils/useHappyAction';
import { Audio } from 'expo-av';
import * as React from 'react';
import { hapticsLight } from '../libs/haptics';
import { backoff, delay } from '@/utils/time';
import { Image, Text, View } from 'react-native';
import { RoundButton } from '../components/RoundButton';
import { Theme } from '../theme';
import { readFileAsync } from '@/modules/fs/fs';

export const VoiceRecordFragment = React.memo((props: { client: BackendClient, skippable: boolean, completed: (skipped: boolean) => Promise<void> }) => {
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
            hapticsLight();
            setState('Prepare in 3s...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            hapticsLight();
            setState('Prepare in 2s...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            hapticsLight();
            setState('Prepare in 1s...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Start
            hapticsLight();
            setState('Recording...');
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            await delay(5000);
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI()!;
            console.log('Recording URI:', uri);

            // Verification
            setState('Uploading...');
            let sample = await readFileAsync(uri, 'base64');
            await backoff(() => props.client.uploadVoiceSample(sample));

            // Success
            setState('Success!');
            await delay(1000);
            props.completed(false);
        } catch (e) {
            setState('Error during recording');
        }
    });

    const [executingSkip, skipAction] = useHappyAction(async () => {
        props.completed(true);
    });

    return (
        <View style={{ flexGrow: 1, backgroundColor: Theme.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
            <Image source={require('@/app/assets/singer_3d_default.png')} style={{ width: 200, height: 200, marginBottom: 32 }} />
            <Text style={{ color: Theme.text, fontSize: 22, alignSelf: 'center', lineHeight: 30, textAlign: 'center', marginBottom: 48 }}>To improve performance, {'\n'}AI need 5 seconds of your voice</Text>
            <Text style={{ color: Theme.text, fontSize: 20, marginBottom: 48, height: 24 }} numberOfLines={1}>{state}</Text>
            <RoundButton title='Record voice sample' onPress={action} loading={executing} />
            {props.skippable && (
                <View style={{ marginTop: 16 }}>
                    <RoundButton title='Not now' display='inverted' onPress={skipAction} loading={executingSkip} />
                </View>
            )}
        </View>
    );
});