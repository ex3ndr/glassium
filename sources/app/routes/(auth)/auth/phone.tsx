import * as React from 'react';
import { Text, TextInput, View } from 'react-native';
import * as RNLocalize from "react-native-localize";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { parsePhoneNumber } from 'libphonenumber-js';
import { useLayout } from '@/utils/useLayout';
import { Country, countries } from '@/utils/countries';
import { useHappyAction } from '@/utils/useHappyAction';
import { requestPhoneAuth } from '@/modules/api/auth';
import { Theme } from '@/app/theme';
import { SButton } from '@/app/components/SButton';
import { storage } from '@/storage';
import { router } from 'expo-router';
import { KeyboardAvoidingView } from '@/app/components/KeyboardAvoidingView';

export default function Phone() {

    const safeArea = useSafeAreaInsets();
    const layout = useLayout();

    // Fields
    const inputRef = React.useRef<TextInput>(null);
    const defaultCountry = React.useMemo(() => {
        let c = RNLocalize.getCountry().toLowerCase();
        let country = countries.find((v) => v.shortname.toLowerCase() === c)
        if (!country) {
            country = countries.find((v) => v.shortname.toLowerCase() === 'us')
        }
        return country!;
    }, []);
    const [country, setCountry] = React.useState(defaultCountry);
    const [number, setNumber] = React.useState('');
    React.useEffect(() => {
        let l = storage.addOnValueChangedListener((k) => {
            if (k === 'auth-country') {
                let c = storage.getString('auth-country');
                if (c) {
                    let country = countries.find((v) => v.shortname === c);
                    if (country) {
                        setCountry(country);
                    }
                }
            }
        });
        return () => {
            l.remove();
        };
    }, []);

    // Actions
    const [requesting, doRequest] = useHappyAction(async () => {
        let val = country.value + ' ' + number;
        await requestPhoneAuth(val, '');
        storage.set('auth-number', val);
        router.navigate('auth/code');
    });
    const openCountryPicker = React.useCallback(() => {
        router.navigate('auth/country');
    }, []);
    const setNumberValue = React.useCallback((src: string) => {
        if (requesting) {
            return;
        }
        try {
            const parsed = parsePhoneNumber(src);
            if (parsed && parsed.countryCallingCode) {
                let ex: Country | undefined;
                if ('+' + parsed.countryCallingCode === defaultCountry.value) {
                    ex = defaultCountry;
                } else if (parsed.countryCallingCode === '1') {
                    ex = countries.find((v) => v.shortname === 'US');
                } else if (parsed.countryCallingCode === '7') {
                    ex = countries.find((v) => v.shortname === 'RU');
                } else {
                    ex = countries.find((v) => v.value === '+' + parsed.countryCallingCode);
                }
                if (ex) {
                    setCountry(ex);
                    setNumber(parsed.nationalNumber);
                    return;
                }
            }
        } catch (e) {
            // Ignore
        }
        setNumber(src);
    }, [requesting]);

    return (
        <>
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
                        <View style={{ flexGrow: 10000, maxHeight: 300 }}>
                            <View style={{ marginBottom: 16 }}>
                                <Text style={{ fontSize: 36, alignSelf: 'center', marginBottom: 8, color: Theme.text }}>Your Phone</Text>
                                <Text style={{ fontSize: 22, color: Theme.text, alignSelf: 'center', lineHeight: 30 }}>Please, confirm your country code</Text>
                                <Text style={{ fontSize: 22, color: Theme.text, alignSelf: 'center', lineHeight: 30 }}>and enter your phone number.</Text>
                            </View>
                            <View style={{ flexGrow: 1 }} />
                            <SButton title={country.label + ' ' + country.emoji} style={{ alignSelf: 'stretch', marginBottom: 12 }} onPress={openCountryPicker} disabled={requesting} />
                            <View style={{ height: 50, backgroundColor: '#F2F2F2', alignSelf: 'stretch', flexDirection: 'row', borderRadius: 8 }}>
                                <View style={{ marginLeft: 4, width: 60, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 17, fontWeight: '500', color: '#9D9FA3' }}>
                                        {country.value}
                                    </Text>
                                </View>
                                <TextInput
                                    ref={inputRef}
                                    placeholder='Phone number'
                                    keyboardType='phone-pad'
                                    value={number}
                                    onChangeText={setNumberValue}
                                    placeholderTextColor="#9D9FA3"
                                    style={{
                                        height: 50,
                                        paddingLeft: 64,
                                        paddingRight: 16,
                                        fontSize: 17,
                                        fontWeight: '500',
                                        position: 'absolute',
                                        left: 0,
                                        right: 0,
                                        top: 0,
                                        bottom: 0,
                                    }}
                                />
                            </View>
                            <View style={{ flexGrow: 1 }} />
                        </View>
                        {layout === 'small' && (
                            <View style={{ flexGrow: 1 }} />
                        )}
                        <SButton title='Continue' style={{ alignSelf: 'stretch', marginTop: 16, marginBottom: 16 }} onPress={doRequest} loading={requesting} />
                        {layout === 'large' && (
                            <View style={{ flexGrow: 1 }} />
                        )}
                    </View>
                </KeyboardAvoidingView>
            </View>
        </>
    );
}