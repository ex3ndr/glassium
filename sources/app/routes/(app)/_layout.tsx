import * as React from 'react';
import { getAppModel, useGlobalState } from "@/global";
import { useLayout } from "@/utils/useLayout";
import { Redirect } from "expo-router";
import { Provider } from 'jotai';
import { View } from "react-native";
import { Drawer } from 'expo-router/drawer';
import { Theme } from '@/app/theme';
import { Sidebar } from './_navigation';

// Error boundary
export { ErrorBoundary } from 'expo-router';

export default function AppLayout() {
    const state = useGlobalState();
    const layout = useLayout();

    // Style the drawer
    const drawerNavigationOptions = (p: any) => {
        let state = p.navigation.getState();
        // let isInRoot = true;
        // if (state.type === 'drawer' && state.routes.length === 1) {
        //     if (state.routes[0].name === '(screens)' && state.routes[0].state && state.routes[0].state.routes) {
        //         if (state.routes[0].state.routes.length > 1) {
        //             isInRoot = false;
        //         }
        //     }
        // }
        return {
            headerShown: false,
            drawerType: layout === 'large' ? 'permanent' : 'front',
            drawerStyle: {
                backgroundColor: Theme.panel,
                borderRightWidth: 0,
                width: 240,
            },
            // swipeEnabled: isInRoot
            swipeEnabled: false
        } as any;
    };

    // Redirect if not onboarded or not logged in
    if (state.kind === 'onboarding') {
        return <Redirect href="/(onboarding)" />;
    }
    if (state.kind === 'empty') {
        return <Redirect href="/(auth)" />;
    }

    // Render the app
    return (
        <Provider store={getAppModel().jotai}>
            <View
                style={{
                    flexDirection: 'row',
                    alignSelf: 'stretch',
                    flexGrow: 1,
                    flexBasis: 0
                }}
            >
                <Drawer
                    screenOptions={drawerNavigationOptions}
                    drawerContent={() => <Sidebar />}
                />
            </View>
        </Provider>
    );
}