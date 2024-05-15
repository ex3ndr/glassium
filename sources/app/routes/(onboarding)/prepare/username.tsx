import * as React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useLayout } from '@/utils/useLayout';
import { useClient } from '@/global';
import { ShakeInstance, Shaker } from '@/app/components/Shaker';
import { useHappyAction } from '@/utils/useHappyAction';
import { checkUsername } from '@/utils/checkUsername';
import { alert } from '@/utils/alert';
import { Theme } from '@/app/theme';
import { SInput } from '@/app/components/SInput';
import { SButton } from '@/app/components/SButton';
import { useRefresh } from '../_resolve';
import { KeyboardAvoidingView } from '@/app/components/KeyboardAvoidingView';

export default React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const layout = useLayout();
    const client = useClient();
    const refresh = useRefresh();

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
            await refresh(); // This moves to the next screen
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
                style={{
                    flexGrow: 1,
                    alignItems: 'center',
                    flexDirection: 'column',
                    paddingHorizontal: 32,
                    marginBottom: safeArea.bottom,
                    maxWidth: 500
                }}
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