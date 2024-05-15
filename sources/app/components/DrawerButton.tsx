import * as React from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLayout } from '@/utils/useLayout';
import { Theme } from '../theme';
import { useNavigation } from 'expo-router';

export const DrawerButton = React.memo((props: { canGoBack: boolean }) => {
    const layout = useLayout();
    const navigation = useNavigation();
    const toggleDrawer = () => {
        navigation.dispatch({ type: 'TOGGLE_DRAWER' });
    };

    // Wew case
    if (Platform.OS === 'web') {

        let component: any = null;
        if (props.canGoBack) {
            component = (
                <Pressable onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Theme.text} />
                </Pressable>
            );
        } else if (layout === 'small') {
            component = (
                <Pressable onPress={toggleDrawer}>
                    <Ionicons name="menu" size={24} color={Theme.text} />
                </Pressable>
            );
        }

        return (
            <View style={{ paddingLeft: 16 }}>
                {component}
            </View>
        );
    }

    // Mobile case
    if (layout === 'large' || props.canGoBack) {
        return null;
    }
    return (
        <Pressable onPress={toggleDrawer} hitSlop={24} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="menu" size={24} color={Theme.text} />
        </Pressable>
    )
});