import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../theme';
import { TopBar } from './home/components/TopBar';
import { BottomBar } from './home/components/BottomBar';
import { SessionsScreens } from './home/SessionsScreen';
import { HomeScreen } from './home/HomeScreen';
import { SearchScreen } from './home/SearchScreen';
import { SettingsScreen } from './home/SettingsScreen';
import { storage } from '../storage';
import { MagicScreen } from './magic/MagicScreen';

export const RootScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const [tab, setTab] = React.useState<'memories' | 'magic' | 'settings'>('magic');
    const onTabPress = (page: 'memories' | 'magic' | 'settings') => {
        storage.set('app-tab', page);
        setTab(page);
    };

    return (
        <View style={[styles.container, { paddingTop: safeArea.top }]}>
            <TopBar />
            <View style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'column', alignItems: 'stretch', alignSelf: 'stretch', display: tab === 'memories' ? 'flex' : 'none' }}>
                <HomeScreen />
            </View>
            <View style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'column', alignItems: 'stretch', alignSelf: 'stretch', display: tab === 'magic' ? 'flex' : 'none' }}>
                <MagicScreen />
            </View>
            {/* <View style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'column', alignItems: 'stretch', alignSelf: 'stretch', display: tab === 'search' ? 'flex' : 'none' }}>
                <SearchScreen />
            </View>
            <View style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'column', alignItems: 'stretch', alignSelf: 'stretch', display: tab === 'sessions' ? 'flex' : 'none' }}>
                <SessionsScreens />
            </View> */}
            <View style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'column', alignItems: 'stretch', alignSelf: 'stretch', display: tab === 'settings' ? 'flex' : 'none' }}>
                <SettingsScreen />
            </View>
            <View style={[styles.bottomBar, { height: 64 + safeArea.bottom, paddingBottom: safeArea.bottom }]}>
                <BottomBar active={tab} onPress={onTabPress} />
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Theme.background
    },
    bottomBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Theme.background
    }
});