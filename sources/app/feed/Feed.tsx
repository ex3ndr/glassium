import * as React from 'react';
import { FeedItemComponent } from './FeedItem';
import { FlashList } from '@shopify/flash-list';
import { ActivityIndicator, Text, View } from 'react-native';
import { Theme } from '../../theme';
import { useAppModel } from '../../global';
import { FeedState, FeedViewItem } from '../../modules/state/FeedService';

const Header = React.memo((props: { loading: boolean }) => {
    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', height: 64 }}>
            {props.loading && <ActivityIndicator color={Theme.text} size="small" />}
            {!props.loading && <Text style={{ color: Theme.text, opacity: 0.4 }}>Start of your journey</Text>}
        </View>
    );
})

const Footer = React.memo(() => {
    return (
        <View style={{ height: 80 }} />
    );
});

export const Feed = React.memo((props: {
    feed: string,
    inverted?: boolean,
    empty?: React.ReactNode
}) => {

    // State
    const app = useAppModel();
    const feed = app.feed.use(props.feed);
    const itemRender = React.useCallback((args: { item: FeedViewItem }) => {
        return <FeedItemComponent item={args.item} app={app} />
    }, [app]);
    const header = React.useCallback(() => {
        return <Header loading={!!feed && !!feed.next} />
    }, [feed && feed.next]);
    const onEndReached = React.useCallback(() => {
        let n = feed ? feed.next : null;
        app.feed.onReachedEnd(props.feed, n);
    }, [feed && feed.next]);

    // Loading
    if (!feed) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Theme.text} />
            </View>
        );
    }

    // Empty
    if (feed.items.length === 0) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                {props.empty || <Text style={{ color: Theme.text, fontSize: 24, opacity: 0.7 }}>Soon.</Text>}
            </View>
        );
    }

    return (
        <FlashList
            data={feed.items}
            renderItem={itemRender}
            keyExtractor={(item) => 'post-' + item.seq}
            ListHeaderComponent={props.inverted ? Footer : header}
            ListFooterComponent={props.inverted ? header : Footer}
            onEndReached={onEndReached}
            inverted={props.inverted}
        />
    )
});