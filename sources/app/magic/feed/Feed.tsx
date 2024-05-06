import * as React from 'react';
import { FeedItemComponent } from './FeedItem';
import { useAppModel } from '../../../global';
import { FeedViewItem } from '../../../modules/state/FeedService';
import { FlashList } from '@shopify/flash-list';
import { Text, View } from 'react-native';
import { Theme } from '../../../theme';

const Header = React.memo(() => {
    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', height: 64 }}>
            <Text style={{ color: Theme.text, opacity: 0.4 }}>Start of your journey</Text>
        </View>
    )
})

const Footer = React.memo(() => {
    return (
        <View style={{ height: 80 }} />
    )
});

export const Feed = React.memo(() => {
    const app = useAppModel();
    const feed = app.feed.use();
    const itemRender = React.useCallback((args: { item: FeedViewItem }) => {
        return <FeedItemComponent item={args.item} app={app} />
    }, [app]);
    return (
        <FlashList
            data={feed!.items}
            renderItem={itemRender}
            ListHeaderComponent={Footer}
            ListFooterComponent={Header}
            inverted={true}
        />
    )
});