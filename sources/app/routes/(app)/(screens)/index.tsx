import * as React from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppModel } from '@/global';
import { Banner } from '@/app/components/Banner';
import { Theme } from '@/app/theme';
import { Feed } from '@/app/components/feed/Feed';
import { useLayout } from '@/utils/useLayout';
import { router } from 'expo-router';
import { HomeHeader, HomeTopBar } from '../_navigation';

export default React.memo(() => {
    const app = useAppModel();
    const me = app.profile.use();
    const safeArea = useSafeAreaInsets();
    const layout = useLayout();

    // Views
    const header = (
        <View style={{ paddingHorizontal: 16, gap: 8 }}>
            <HomeTopBar />
            {/* {me && !me.voiceSample && (
                <Banner title="Voice sample needed" text="To improve AI experience, please, record a voice sample" kind="normal" onPress={() => router.navigate('voice-sample')} />
            )} */}
            <Banner title="Voice sample needed" text="To improve AI experience, please, record a voice sample" kind="normal" onPress={() => router.navigate('voice-sample')} />
            {layout === 'small' && (
                <Pressable
                    style={(p) => ({
                        backgroundColor: p.pressed ? '#131313' : '#1d1d1d',
                        borderRadius: 16,
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                        flexDirection: 'row'
                    })}
                    onPress={() => router.navigate('/data/transcripts')}
                >
                    <Text style={{ color: Theme.text, fontSize: 18 }}>View transcripts</Text>
                </Pressable>
            )}
            {/* <Text style={{ fontSize: 18, color: Theme.text, paddingHorizontal: 32, marginTop: 16, fontWeight: '700' }}>Chats</Text>
            <Pressable
                style={(p) => ({
                    backgroundColor: p.pressed ? '#131313' : '#1d1d1d',
                    borderRadius: 16,
                    marginHorizontal: 16,
                    marginVertical: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    height: 90,
                    flexDirection: 'row'
                })}
                onPress={() => router.navigate('chat', { id: 'ai' })}
            >
                <Image
                    source={{ uri: 'https://picsum.photos/200/300' }}
                    style={{ width: 60, height: 60, borderRadius: 30 }}
                />
                <View style={{ flexDirection: 'column', marginLeft: 16, justifyContent: 'center' }}>
                    <Text style={{ color: Theme.text, fontSize: 18 }} numberOfLines={1}>Glassium Assistant</Text>
                    <Text style={{ color: Theme.text, fontSize: 16, opacity: 0.8 }} numberOfLines={1}>Tap to start a new chat</Text>
                </View>
            </Pressable> */}
            <Text style={{ fontSize: 18, color: Theme.text, paddingHorizontal: 16, marginTop: 16, fontWeight: '700' }}>Moments</Text>
        </View>
    );
    const footer = (loading: boolean) => {
        return (
            <View style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 8, height: 64, marginBottom: safeArea.bottom, flexDirection: 'column' }}>
                {loading && (<ActivityIndicator />)}
                {!loading && <Text style={{ color: Theme.text, opacity: 0.7 }}>The end.</Text>}
            </View>
        )
    }
    const empty = (
        <ScrollView style={{ flex: 1 }} alwaysBounceVertical={false}>
            {header}
            <Text style={{ fontSize: 16, color: Theme.text, paddingHorizontal: 32, opacity: 0.7, marginVertical: 8 }}>Moments will appear here once AI find something interesting</Text>
            <View style={{ height: safeArea.bottom + 16 }} />
        </ScrollView>
    );
    const loading = (
        <ScrollView style={{ flex: 1 }} alwaysBounceVertical={false}>
            {header}
            <ActivityIndicator />
            <View style={{ height: safeArea.bottom + 16 }} />
        </ScrollView>
    );
    return (
        <>
            <HomeHeader />
            <View style={{ alignSelf: 'stretch', flexGrow: 1, flexBasis: 0 }}>
                <Feed
                    feed='smart'
                    display='large'
                    header={() => header}
                    footer={footer}
                    empty={empty}
                    loading={loading}
                />
            </View>
        </>
    );
});