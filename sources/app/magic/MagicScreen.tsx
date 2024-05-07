import * as React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { useAppModel } from '../../global';
import { useRouter } from '../../routing';
import { Feed } from '../feed/Feed';

export const MagicScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const app = useAppModel();
    const feed = app.feed.use('default');
    const router = useRouter();

    // // Resolve LED stripe text
    // let ledStripeText = '...';
    // if (wearable.pairing === 'need-pairing') {
    //     ledStripeText = `need pairing`;
    // } else if (wearable.pairing === 'denied') {

    // } else if (wearable.pairing === 'unavailable') {

    // } else if (wearable.pairing === 'ready') {
    //     if (wearable.device && (wearable.device.status === 'disconnected' || wearable.device.status === 'connecting')) {
    //         ledStripeText = `connecting...`;
    //     } else {
    //         if (capture.streaming && !capture.localMute) {
    //             if (endpointing === 'voice') {
    //                 ledStripeText = `(voice detected)`;
    //             } else {
    //                 ledStripeText = `listening`;
    //             }
    //         } else {
    //             ledStripeText = `idle`;
    //         }
    //     }
    // }

    return (
        <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom + 64 }}>
            {/* <LedStripe text={ledStripeText} /> */}

            {/* NOTE: <Feed/> will crash if feed is null */}
            {feed && feed.items.length > 0 && (
                <View style={{ flex: 1 }}>
                    <Feed feed={feed} />
                </View>
            )}
            {feed && feed.items.length === 0 && (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: Theme.text, fontSize: 24, opacity: 0.7 }}>Soon.</Text>
                </View>
            )}
            {!feed && (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Theme.text} />
                </View>
            )}
            <View style={{ position: 'absolute', bottom: safeArea.bottom + 64, left: 0, right: 0, alignItems: 'stretch' }}>
                <Pressable style={{ height: 48, borderRadius: 32, backgroundColor: '#222222', justifyContent: 'center', alignItems: 'center', marginHorizontal: 16, marginVertical: 16 }} onPress={() => router.navigate('discussion')}>
                    <Text style={{ color: Theme.text, fontSize: 16 }}>Chat with AI</Text>
                </Pressable>
            </View>
        </View>
    );
});