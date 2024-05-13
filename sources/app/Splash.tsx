import * as React from 'react';
import { Image, Text, View } from 'react-native';
import { Theme } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoundButton } from './components/RoundButton';
import { useRouter } from '../routing';
import { useLayout } from '../utils/useLayout';

export const Splash = React.memo(() => {
    const router = useRouter();
    const safeArea = useSafeAreaInsets();
    const layout = useLayout();
    const doStart = React.useCallback(async () => {
        router.navigate('phone');
    }, []);
    return (
        <>
            <View
                style={{
                    flexGrow: 1,
                    flexBasis: 0,
                    alignSelf: 'stretch',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    paddingHorizontal: 64,
                    paddingBottom: safeArea.bottom,
                    backgroundColor: Theme.background
                }}
            >
                <View style={{ flexGrow: 1 }} />
                <Image source={require('./assets/splash.png')} style={{ width: 256, height: 256 }} />
                <Text style={{ fontSize: 32, color: Theme.text, marginTop: 16, fontWeight: '600' }}>
                    Bubble AI
                </Text>
                <Text style={{ fontSize: 18, color: Theme.text, textAlign: 'center', marginTop: 8, marginBottom: 64 }}>
                    All-in-one app for AI Wearable devices
                </Text>
                {layout === 'small' && (
                    <View style={{ flexGrow: 1 }} />
                )}
                <RoundButton display="default" title={"Start"} style={{ width: 300, marginBottom: 16 }} onPress={doStart} />
                {layout === 'large' && (
                    <View style={{ flexGrow: 1 }} />
                )}
            </View>
        </>
    );
});