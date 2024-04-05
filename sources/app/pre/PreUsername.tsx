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

export const PreUsernameScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const client = useClient();
    const controller = useGlobalStateController();
    const [loading, setLoading] = React.useState(false);
    const [username, setUsername] = React.useState('');
    const usernameRef = React.useRef<ShakeInstance>(null);
    const onContinue = React.useCallback(() => {
        if (loading) {
            return;
        }

        // Normalize and check
        let name = username.trim();
        if (!checkUsername(name)) {
            usernameRef.current?.shake();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        // // Create username
        // run(async () => {
        //     setLoading(true);
        //     try {

        //         // Create username
        //         let res = await backoff(() => client.post('/account/create_username', { username: name }));
        //         if (!res.data.ok) {
        //             if (res.data.error === 'invalid_username') {
        //                 usernameRef.current?.shake();
        //                 Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        //             } else if (res.data.error === 'username_taken') {
        //                 Alert.alert(t('errors.title'), t('errors.usernameTaken'));
        //             } else {
        //                 Alert.alert(t('errors.title'), t('errors.unknown'));
        //             }
        //             return;
        //         }

        //         // Refresh onboarding
        //         await controller.refresh();
        //     } finally {
        //         setLoading(false);
        //     }
        // });
    }, [loading, username]);
    return (
        <View style={{ flexGrow: 1, backgroundColor: Theme.background }}>
            <KeyboardAvoidingView
                style={{ flexGrow: 1, alignItems: 'center', flexDirection: 'column', paddingHorizontal: 32, marginBottom: safeArea.bottom }}
                behavior="padding"
                keyboardVerticalOffset={safeArea.top + 44}
            >
                <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', justifyContent: 'space-between' }}>
                    <View />
                    <View>
                        <Text style={{ fontSize: 36, alignSelf: 'center', marginBottom: 8 }}>Pick a username</Text>
                        <Text style={{ fontSize: 22, alignSelf: 'center', lineHeight: 30 }}>How your friends should find you?</Text>
                        <Shaker ref={usernameRef}>
                            <SInput placeholder='Username' style={{ marginTop: 24 }} value={username} onValueChange={setUsername} />
                        </Shaker>
                    </View>
                    <SButton title='Continue' style={{ alignSelf: 'stretch', marginTop: 48, paddingBottom: 16 }} onPress={onContinue} loading={loading} />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
});