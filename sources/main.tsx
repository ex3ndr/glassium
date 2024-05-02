import * as React from 'react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Platform, View } from 'react-native';
import { Theme } from './theme';
import { GlobalStateContext, GlobalStateControllerContext, getAppModel, getPostHog, useNewGlobalController } from './global';
import { App, Auth, Modals, Pre, Stack } from './app/routing';
import { Provider } from 'jotai';
import { PostHogProvider } from 'posthog-react-native';

let startMetrics = initialWindowMetrics;
if (Platform.OS === 'android') {
    startMetrics!.insets.top = 0;
    startMetrics!.insets.bottom = 0;
}

export function Boot() {
    const [state, controller] = useNewGlobalController();

    let content = (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShadowVisible: false,
                    headerBackTitle: 'Back',
                    headerTintColor: Theme.accent,
                    headerStyle: {
                        backgroundColor: Theme.background,
                    },
                    title: ''
                }}
            >
                {state.kind === 'empty' && Auth}
                {state.kind === 'onboarding' && Pre(state.state)}
                {state.kind === 'ready' && App}
                <Stack.Group screenOptions={{ presentation: 'modal' }}>
                    {Modals}
                </Stack.Group>
            </Stack.Navigator>
        </NavigationContainer>
    );

    if (Platform.OS === 'web') {
        content = (
            <View style={{ flexGrow: 1, alignSelf: 'stretch', flexBasis: 0, backgroundColor: '#333', flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch' }}>
                <View style={{ flexGrow: 1, flexBasis: 0, maxHeight: 980, justifyContent: 'center', flexDirection: 'row', alignItems: 'stretch' }}>
                    <View style={{ flexGrow: 1, flexBasis: 480, maxWidth: 600, flexDirection: 'column', overflow: 'hidden', alignItems: 'stretch', borderRadius: 8 }}>
                        {content}
                    </View>
                </View>
            </View>
        );
    }

    return (
        <PostHogProvider client={getPostHog()}>
            <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}>
                <SafeAreaProvider initialMetrics={startMetrics}>
                    <GlobalStateContext.Provider value={state}>
                        <GlobalStateControllerContext.Provider value={controller}>
                            {state.kind === 'ready' && (
                                <Provider store={getAppModel().jotai}>
                                    {content}
                                </Provider>
                            )}
                            {state.kind !== 'ready' && (
                                content
                            )}
                        </GlobalStateControllerContext.Provider>
                    </GlobalStateContext.Provider>
                </SafeAreaProvider>
            </View>
        </PostHogProvider>
    );
}