import * as React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/app/theme';
import { Feed } from '@/app/components/feed/Feed';
import { HomeHeader, HomeTopBar } from '../_navigation';
import { useLayout } from '@/utils/useLayout';
import LottieView from 'lottie-react-native';

export default React.memo(() => {
    const layout = useLayout();
    const safeArea = useSafeAreaInsets();

    // Views
    const header = (
        <View style={{ paddingHorizontal: 16, gap: 16, marginTop: (layout === 'large' ? (24 + safeArea.top) : 8) }}>
            <HomeTopBar />
            <Text style={{ fontSize: 18, color: Theme.text, paddingHorizontal: 16, fontWeight: '700' }}>Moments</Text>
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
        <ScrollView style={{ flex: 1 }} alwaysBounceVertical={false} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ paddingHorizontal: 16, gap: 16, marginTop: (layout === 'large' ? (24 + safeArea.top) : 8) }}>
                <HomeTopBar />
            </View>
            <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 200, height: 200 }}>
                    <LottieView
                        style={{ width: 200, height: 200, alignSelf: 'center' }}
                        source={require('@/app/assets/animation_owl.json')}
                        autoPlay={true}
                        loop={false}
                    />
                </View>
                <Text style={{ fontSize: 16, color: Theme.text, paddingHorizontal: 32, opacity: 0.7, marginVertical: 8, textAlign: 'center' }}>Moments will appear once{'\n'}AI find something interesting</Text>
            </View>
        </ScrollView>
    );
    const loading = (
        <ScrollView style={{ flex: 1 }} alwaysBounceVertical={false} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ paddingHorizontal: 16, gap: 16, marginTop: (layout === 'large' ? (24 + safeArea.top) : 8) }}>
                <HomeTopBar />
            </View>
            <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={Theme.text} />
            </View>
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