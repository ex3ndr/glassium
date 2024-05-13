import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { TopBar } from './components/TopBar';
import { AIScreen } from './AIScreen';
import { useLayout } from '../../utils/useLayout';

export const HomeScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const layout = useLayout();
    return (
        <View style={[styles.container, { paddingTop: safeArea.top }]}>
            {layout === 'large' && (
                <View style={{ width: 250, alignSelf: 'stretch', backgroundColor: '#000' }}>
                    <TopBar />
                </View>
            )}
            <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                {layout === 'small' && (
                    <TopBar />
                )}
                <View style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'column', alignItems: 'stretch', alignSelf: 'stretch' }}>
                    <AIScreen />
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'stretch',
        backgroundColor: Theme.background,
        flexDirection: 'row'
    }
});