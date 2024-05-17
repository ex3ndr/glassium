import { RoundButton } from '@/app/components/RoundButton';
import { Theme } from '@/app/theme';
import { useLayout } from '@/utils/useLayout';
import { Stack, router } from 'expo-router';
import * as React from 'react';
import { Image, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Splash() {
    const safeArea = useSafeAreaInsets();
    const layout = useLayout();
    const doStart = React.useCallback(async () => {
        router.navigate('auth/phone');
    }, []);
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
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
                {Platform.OS === 'web' && (
                    <View style={{ flexDirection: 'row', gap: 32, paddingVertical: 16 }}>
                        <a href="https://basedhardware.com" target='_blank' className='link'>Hardware</a>
                        <a href="https://docs.glassium.org/" target='_blank' className='link'>Docs</a>
                        <a href="https://github.com/ex3ndr/glassium" target='_blank' className='link'>Github</a>
                    </View>
                )}
                <View style={{ flexGrow: 1 }} />
                <Image source={require('@/app/assets/splash_2.png')} style={layout === 'large' ? { width: 256, height: 256 } : { width: 200, height: 200 }} />
                <Text style={{ fontSize: 32, color: Theme.text, marginTop: 16, fontWeight: '600' }}>
                    Glassium
                </Text>
                <Text style={{ fontSize: 18, color: Theme.text, textAlign: 'center', marginTop: 8, marginBottom: 64 }}>
                    AI agents that live with you
                </Text>
                {layout === 'small' && Platform.OS !== 'web' && (
                    <View style={{ flexGrow: 1 }} />
                )}

                {Platform.OS === 'web' && (
                    <>
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 32, width: 180 * 2 + 8 }}>
                            <a href="https://play.google.com/store/apps/details?id=com.bubbleapp.android">
                                <img
                                    src="/googleplay.png"
                                    alt="Download on the Google Play"
                                    style={{ width: 180, height: 52 }}
                                />
                            </a>
                            <a href="https://apps.apple.com/app/bubble-ai/id6499084145">
                                <img
                                    src="/appstore.png"
                                    alt="Download on the App Store"
                                    style={{ width: 180, height: 52 }}
                                />
                            </a>
                        </View>
                        <RoundButton display="inverted" title={'Continue on Web'} style={{ width: 300, marginBottom: 16 }} onPress={doStart} />
                    </>
                )}
                {Platform.OS !== 'web' && (
                    <RoundButton display="default" title={'Start'} style={{ width: 300, marginBottom: 16 }} onPress={doStart} />
                )}
                {(layout === 'large' || Platform.OS === 'web') && (
                    <View style={{ flexGrow: 1 }} />
                )}
                {Platform.OS === 'web' && (
                    <View style={{ flexDirection: 'row', gap: 32, marginBottom: 32, opacity: 0.5 }}>
                        <a href="/support" className='link'>
                            Support
                        </a>
                        <a href="/legal/tos" className='link'>
                            Terms
                        </a>
                        <a href="/legal/privacy" className='link'>
                            Privacy
                        </a>
                    </View>

                )}
            </View>
        </>
    );
}