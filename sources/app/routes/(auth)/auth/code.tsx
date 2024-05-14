import * as React from 'react';
import { KeyboardAvoidingView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobalStateController } from '@/global';
import { useLayout } from '@/utils/useLayout';
import { useRouter } from '@/routing';
import { useHappyAction } from '@/utils/useHappyAction';
import { requestPhoneAuthVerify } from '@/modules/api/auth';
import { storage } from '@/storage';
import { Theme } from '@/theme';
import { SButton } from '@/app/components/SButton';

export default function CodeScreen() {

    const controller = useGlobalStateController();
    const layout = useLayout();
    const router = useRouter();
    const number = storage.getString('auth-number')!;
    const safeArea = useSafeAreaInsets();
    const [code, setCode] = React.useState('');
    const inputRef = React.useRef<TextInput>(null);
    const [requesting, doRequest] = useHappyAction(async () => {
        if (code.length < 6) {
            return;
        }
        let output = await requestPhoneAuthVerify(number, '', code);
        if (output === null) {
            router.goBack();
            return;
        }

        // Successful login
        controller.login(output);
    })
    const doSetCode = React.useCallback((v: string) => {
        if (requesting) {
            return;
        }
        v = v.replace(/[^0-9\s]/g, '').trim();
        if (v.length > 6) {
            v = v.slice(0, 6);
        }
        setCode(v);
    }, []);
    return (
        <View style={{ flexGrow: 1, backgroundColor: Theme.background, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'center' }}>
            <KeyboardAvoidingView
                style={{ flexGrow: 1, alignItems: 'center', flexDirection: 'column', paddingHorizontal: 32, marginBottom: safeArea.bottom, maxWidth: 500 }}
                behavior="padding"
                keyboardVerticalOffset={safeArea.top + 44}
            >
                <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}>
                    <View style={{ flexGrow: 1 }} />
                    <View style={{ alignItems: 'center' }} >
                        <Text style={{ fontSize: 36, alignSelf: 'center', marginBottom: 8, color: Theme.text }}>Enter code</Text>
                        <Text style={{ fontSize: 22, alignSelf: 'center', lineHeight: 30, color: Theme.text }}>We've sent the code</Text>
                        <Text style={{ fontSize: 22, alignSelf: 'center', lineHeight: 30, color: Theme.text }}>to <Text style={{ fontWeight: '600' }}>{number}</Text>.</Text>
                        <TextInput
                            ref={inputRef}
                            value={code}
                            onChangeText={doSetCode}
                            placeholder='000000'
                            inputMode='numeric'
                            keyboardType='decimal-pad'
                            autoCapitalize="none"
                            autoComplete='off'
                            textContentType="oneTimeCode"
                            autoFocus={true}
                            style={{
                                width: 167,
                                marginTop: 16,
                                height: 64,
                                backgroundColor: '#F2F2F2',
                                borderRadius: 16,
                                paddingLeft: 24,
                                paddingRight: 24,
                                fontSize: 32,
                                fontVariant: ['tabular-nums']
                            }}
                            maxLength={6}
                        />
                    </View>
                    {layout === 'small' && (
                        <View style={{ flexGrow: 1 }} />
                    )}
                    <SButton title='Continue' style={{ alignSelf: 'stretch', marginTop: 48, paddingBottom: 16 }} onPress={doRequest} loading={requesting} />
                    {layout === 'large' && (
                        <View style={{ flexGrow: 1 }} />
                    )}
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}