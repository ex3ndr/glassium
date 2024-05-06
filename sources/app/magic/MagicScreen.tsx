import * as React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { useRouter } from '../../routing';
import { useAppModel } from '../../global';
import { FlashList } from '@shopify/flash-list';
import { FeedViewItem } from '../../modules/state/FeedService';
import { FeedItemComponent } from './feed/FeedItem';
import { Feed } from './feed/Feed';


export const MagicScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const router = useRouter();
    const app = useAppModel();
    const feed = app.feed.use();
    const itemRender = React.useCallback((args: { item: FeedViewItem }) => {
        return <FeedItemComponent item={args.item} app={app} />
    }, [app]);

    return (
        <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom + 64 }}>
            {/* NOTE: <Feed/> will crash if feed is null */}
            {feed && feed.items.length > 0 && (
                <View style={{ flex: 1 }}>
                    <Feed />
                </View>
            )}
            {feed && feed.items.length === 0 && (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Theme.text} />
                </View>
            )}
            {!feed && (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: Theme.text, fontSize: 24, opacity: 0.7 }}>Soon.</Text>
                </View>
            )}
            <View style={{ position: 'absolute', bottom: safeArea.bottom + 64, left: 0, right: 0 }}>
                <Pressable style={{ height: 48, borderRadius: 32, backgroundColor: '#222222', justifyContent: 'center', alignItems: 'center', marginHorizontal: 16, marginVertical: 16 }} onPress={() => router.navigate('new-thread')}>
                    <Text style={{ color: Theme.text, fontSize: 16 }}>What do you want to know?</Text>
                </Pressable>
            </View>
        </View>
    );
});