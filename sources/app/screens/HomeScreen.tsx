import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { TopBar } from './components/TopBar';
import { AIScreen } from './AIScreen';

export const HomeScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    return (
        <View style={[styles.container, { paddingTop: safeArea.top }]}>
            <TopBar />
            <View style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'column', alignItems: 'stretch', alignSelf: 'stretch' }}>
                <AIScreen />
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