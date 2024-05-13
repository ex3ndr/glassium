import * as React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useClient, useGlobalStateController } from '../../global';
import { Alert, KeyboardAvoidingView, Text, View } from 'react-native';
import { Theme } from '../../theme';
import { checkUsername } from '../../utils/checkUsername';
import * as Haptics from 'expo-haptics';
// import { run } from '../../utils/run';
// import { backoff } from '../../utils/backoff';
// import { t } from '../../text/t';
import { SButton } from '../components/SButton';
import { ShakeInstance, Shaker } from '../components/Shaker';
import { SInput } from '../components/SInput';
import { useHappyAction } from '../helpers/useHappyAction';
import { alert } from '../helpers/alert';
import { useLayout } from '../../utils/useLayout';

export const PreUsernameScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const layout = useLayout();
    const client = useClient();
    const controller = useGlobalStateController();

    const [username, setUsername] = React.useState('');
    const usernameRef = React.useRef<ShakeInstance>(null);

    const [requesting, doRequest] = useHappyAction(async () => {

        // Normalize and check
        let name = username.trim();
        if (!checkUsername(name)) {
            usernameRef.current?.shake();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        // Create username
        let res = await client.preUsername(name);
        if (res.ok) {
            await controller.refresh(); // This moves to the next screen
        } else {
            if (res.error === 'invalid_username') {
                usernameRef.current?.shake();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                // await alert('Invalid username', 'Please try another username', [{ text: 'OK' }]);
            }
            if (res.error === 'already_used') {
                await alert('Username already used', 'Please try another username', [{ text: 'OK' }]);
            }
        }
    });
    return (
        <View style={{ flexGrow: 1, backgroundColor: Theme.background, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'center' }}>
            <KeyboardAvoidingView
                style={{ flexGrow: 1, alignItems: 'center', flexDirection: 'column', paddingHorizontal: 32, marginBottom: safeArea.bottom, maxWidth: 500 }}
                behavior="padding"
                keyboardVerticalOffset={safeArea.top}
            >
                <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}>
                    <View style={{ flexGrow: 1 }} />
                    <View>
                        <Text style={{ fontSize: 36, alignSelf: 'center', marginBottom: 8, color: Theme.text }}>Pick a username</Text>
                        <Text style={{ fontSize: 22, alignSelf: 'center', lineHeight: 30, color: Theme.text }}>How your friends should find you?</Text>
                        <Shaker ref={usernameRef}>
                            <SInput
                                placeholder='Username'
                                style={{ marginTop: 24 }}
                                value={username}
                                keyboardType="ascii-capable"
                                autoCapitalize="none"
                                onValueChange={setUsername}
                            />
                        </Shaker>
                    </View>
                    {layout === 'small' && (
                        <View style={{ flexGrow: 1 }} />
                    )}
                    <SButton title='Continue' style={{ alignSelf: 'stretch', marginTop: 48 }} onPress={doRequest} loading={requesting} />
                    {layout === 'large' && (
                        <View style={{ flexGrow: 1 }} />
                    )}
                </View>
            </KeyboardAvoidingView>
        </View>
    );
});