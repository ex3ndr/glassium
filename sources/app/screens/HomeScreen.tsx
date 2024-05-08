import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { TopBar } from './components/TopBar';
import { BottomBar } from './components/BottomBar';
import { MemoriesScreen } from './MemoriesScreen';
import { storage } from '../../storage';
import { UpdatesScreen } from './UpdatesScreen';
import { AIScreen } from './AIScreen';

export const HomeScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const [tab, setTab] = React.useState<'memories' | 'ai' | 'log'>('ai');
    const onTabPress = (page: 'memories' | 'ai' | 'log') => {
        storage.set('app-tab', page);
        setTab(page);
    };

    return (
        <View style={[styles.container, { paddingTop: safeArea.top }]}>
            <TopBar />
            <View style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'column', alignItems: 'stretch', alignSelf: 'stretch', display: tab === 'memories' ? 'flex' : 'none' }}>
                <MemoriesScreen />
            </View>
            <View style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'column', alignItems: 'stretch', alignSelf: 'stretch', display: tab === 'ai' ? 'flex' : 'none' }}>
                <AIScreen />
            </View>
            <View style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'column', alignItems: 'stretch', alignSelf: 'stretch', display: tab === 'log' ? 'flex' : 'none' }}>
                <UpdatesScreen />
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