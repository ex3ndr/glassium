import * as React from 'react';
import { FlashList, MasonryFlashList } from '@shopify/flash-list';
import { ActivityIndicator, FlatList, LayoutChangeEvent, LayoutRectangle, Platform, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Theme } from '@/app/theme';
import { FeedViewItem } from '@/modules/services/FeedService';
import { AppService } from '@/modules/services/AppService';
import { ContentView } from './ContentView';
import { TimeView } from '../TimeView';
import { useAppModel } from '@/global';

const Header = React.memo((props: { loading: boolean, display: 'normal' | 'inverted' | 'large', }) => {
    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', height: 64 }}>
            {props.loading && <ActivityIndicator color={Theme.text} size="small" />}
            {!props.loading && <Text style={{ color: Theme.text, opacity: 0.4 }}>Start of your journey</Text>}
        </View>
    );
})

const Footer = React.memo((props: { loading: boolean, display: 'normal' | 'inverted' | 'large' }) => {
    return (
        <View style={{ height: 16 }} />
    );
});

const Item = React.memo((props: { item: FeedViewItem, app: AppService, display: 'normal' | 'inverted' | 'large' }) => {
    let app = props.app;
    let by = app.users.use(props.item.by);
    let image: any = null;
    if (by.username === 'transcribe') {
        image = require('@/app/assets/avatar_transcribe.png')
    } else if (by.username === 'overlord') {
        image = require('@/app/assets/avatar_overlord.png')
    } else if (by.username === 'memory') {
        image = require('@/app/assets/avatar_memory.png')
    } else if (by.username === 'adviser') {
        image = require('@/app/assets/avatar_adviser.png')
    }

    // Handle large case
    if (props.display === 'large') {
        return (
            <View style={{ flexDirection: 'column', marginVertical: 16 }}>
                <View style={{ marginHorizontal: 32, flexDirection: 'row', marginBottom: 4 }}>
                    {image === null && (
                        <View style={{ width: 16, height: 16, borderRadius: 8 }}>
                        </View>
                    )}
                    {image !== null && (
                        <Image source={image} style={{ width: 16, height: 16, borderRadius: 8 }} />
                    )}
                    <Text style={{ color: Theme.text, marginLeft: 4 }}><Text style={{ opacity: 0.7 }}>@{by.username}</Text> </Text>
                    <Text style={{ color: Theme.text, opacity: 0.4 }}><TimeView time={props.item.date} /></Text>
                </View>
                <ContentView content={props.item.content} app={props.app} display={props.display} />
            </View>
        );
    }

    return (
        <View style={{ marginHorizontal: 8, flexDirection: 'row', marginVertical: 4 }}>
            {image === null && (
                <View style={{ width: 32, height: 32, borderRadius: 32 }}>
                </View>
            )}
            {image !== null && (
                <Image source={image} style={{ width: 32, height: 32, borderRadius: 32 }} />
            )}
            <View style={{ flexDirection: 'column', flex: 1, marginLeft: 8 }}>
                <View style={{ flexDirection: 'row' }}>
                    <Text style={{ color: Theme.text }}>{by.firstName} <Text style={{ opacity: 0.7 }}>@{by.username}</Text></Text>
                    <View style={{ flex: 1 }} />
                    <Text style={{ color: Theme.text, opacity: 0.4 }}><TimeView time={props.item.date} /></Text>
                </View>
                <ContentView content={props.item.content} app={props.app} display={'normal'} />
            </View>
        </View>
    );
});

export const Feed = React.memo((props: {
    feed: string,
    empty?: React.ReactNode,
    header?: (loading: boolean) => React.ReactNode,
    footer?: (loading: boolean) => React.ReactNode,
    loading?: React.ReactNode
    display?: 'normal' | 'inverted' | 'large'
}) => {

    // State
    const display = props.display || 'normal';
    const app = useAppModel();
    const feed = app.feed.use(props.feed);
    const itemRender = React.useCallback((args: { item: FeedViewItem }) => {
        return <Item item={args.item} app={app} display={display} />
    }, [app, display]);
    const header = React.useCallback(() => {
        if (props.header) {
            return props.header(!!feed && !!feed.next);
        } else {
            return <Header loading={!!feed && !!feed.next} display={display} />
        }
    }, [!!feed && !!feed.next, props.header]);
    const footer = React.useCallback(() => {
        if (props.footer) {
            return props.footer(!!feed && !!feed.next);
        } else {
            return <Footer loading={!!feed && !!feed.next} display={display} />
        }
    }, [!!feed && !!feed.next, props.footer]);
    const onEndReached = React.useCallback(() => {
        let n = feed ? feed.next : null;
        app.feed.onReachedEnd(props.feed, n);
    }, [feed && feed.next]);
    const [layout, setLayout] = React.useState<LayoutRectangle | null>(null);
    const onLayout = React.useCallback((e: LayoutChangeEvent) => {
        setLayout(e.nativeEvent.layout);
    }, []);
    let mansoryColumns = 1;
    if (layout) {
        if (layout.width > 300) {
            mansoryColumns = Math.floor(layout.width / 300);
        }
    }

    // Loading
    if (!feed || !layout) {
        if (props.loading) {
            return (
                <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', alignItems: 'stretch' }} onLayout={onLayout}>
                    {props.loading}
                </View>
            );
        }
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', alignItems: 'stretch' }} onLayout={onLayout}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Theme.text} />
                </View>
            </View>
        );
    }

    // Empty
    if (feed.items.length === 0) {
        if (props.empty) {
            return (
                <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', alignItems: 'stretch' }} onLayout={onLayout}>
                    {props.empty}
                </View>
            );
        }
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', alignItems: 'stretch' }} onLayout={onLayout}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: Theme.text, fontSize: 24, opacity: 0.7 }}>Soon.</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', alignItems: 'stretch' }} onLayout={onLayout}>
            {props.display !== 'large' && Platform.OS !== 'web' && (
                <FlashList
                    data={feed.items}
                    drawDistance={1000}
                    renderItem={itemRender}
                    keyExtractor={(item) => 'post-' + item.seq}
                    ListHeaderComponent={props.display === 'inverted' ? footer : header}
                    ListFooterComponent={props.display === 'inverted' ? header : footer}
                    onEndReached={onEndReached}
                    inverted={props.display === 'inverted'}
                />
            )}
            {props.display !== 'large' && Platform.OS === 'web' && (
                <FlatList
                    data={feed.items}
                    renderItem={itemRender}
                    keyExtractor={(item) => 'post-' + item.seq}
                    ListHeaderComponent={props.display === 'inverted' ? footer : header}
                    ListFooterComponent={props.display === 'inverted' ? header : footer}
                    onEndReached={onEndReached}
                    inverted={props.display === 'inverted'}
                />
            )}
            {props.display === 'large' && (
                <MasonryFlashList
                    data={feed.items}
                    drawDistance={1000}
                    renderItem={itemRender}
                    keyExtractor={(item) => 'post-' + item.seq}
                    ListHeaderComponent={header}
                    ListFooterComponent={footer}
                    numColumns={mansoryColumns}
                    onEndReached={onEndReached}
                />
            )}
        </View>
    )
});