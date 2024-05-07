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

export const Feed = React.memo((props: { feed: FeedState }) => {
    const app = useAppModel();
    const itemRender = React.useCallback((args: { item: FeedViewItem }) => {
        return <FeedItemComponent item={args.item} app={app} />
    }, [app]);
    const header = React.useCallback(() => {
        return <Header loading={!!props.feed && !!props.feed.next} />
    }, [props.feed && props.feed.next]);
    return (
        <FlashList
            data={props.feed!.items}
            renderItem={itemRender}
            ListHeaderComponent={Footer}
            ListFooterComponent={header}
            inverted={true}
        />
    )
});