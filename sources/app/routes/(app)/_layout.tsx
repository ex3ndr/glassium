import * as React from 'react';
import { getAppModel, useGlobalState } from "@/global";
import { useLayout } from "@/utils/useLayout";
import { Redirect, Stack } from "expo-router";
import { Provider } from 'jotai';
import { View } from "react-native";
import { Drawer } from 'expo-router/drawer';
import { Theme } from '@/app/theme';
import { Sidebar } from './_navigation';

export default function AppLayout() {
    const state = useGlobalState();
    const layout = useLayout();
    if (state.kind === 'onboarding') {
        return <Redirect href="/(onboarding)" />;
    }
    if (state.kind === 'empty') {
        return <Redirect href="/(auth)" />;
    }
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
                {layout === 'large' && (
                    <Sidebar />
                )}
                <View
                    style={{ flexGrow: 1, flexBasis: 0 }}
                >
                    <Stack />
                    {/* <Drawer
                        screenOptions={{
                            drawerType: layout === 'large' ? 'permanent' : 'front',
                            drawerStyle: {
                                backgroundColor: Theme.panel,
                                borderRightWidth: 0,
                                width: 240,
                            },
                        }}
                        drawerContent={Sidebar}
                    /> */}
                </View>
            </View>
        </Provider>
    );
}