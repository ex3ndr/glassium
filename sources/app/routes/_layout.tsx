// Init
import '@/configure.css';
import '@/configure';
import '@/headless';

// Imports
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Navigator, Slot } from 'expo-router';
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '@/modules/track/posthog';
import { GlobalStateContext, GlobalStateControllerContext, useNewGlobalController } from '@/global';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Theme } from '../theme';
import { View } from 'react-native';
import { AlertProvider } from '../libs/alert';

// Configuration
let theme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        background: Theme.background
    },
};

// Error boundary
export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
    initialRouteName: '(app)/index',
};

export default function RootLayout() {
    const [state, controller] = useNewGlobalController();
    return (
        <View style={{ flexDirection: 'row', flexGrow: 1, flexBasis: 0, backgroundColor: Theme.panel, justifyContent: 'center' }}>
            <View style={{ flexGrow: 1, flexBasis: 0, maxWidth: 1600 }}>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <ThemeProvider value={theme}>
                        <PostHogProvider client={posthog}>
                            <GlobalStateContext.Provider value={state}>
                                <GlobalStateControllerContext.Provider value={controller}>
                                    <AlertProvider>
                                        <Navigator>
                                            <Slot />
                                        </Navigator>
                                    </AlertProvider>
                                </GlobalStateControllerContext.Provider>
                            </GlobalStateContext.Provider>
                        </PostHogProvider>
                    </ThemeProvider>
                </GestureHandlerRootView>
            </View>
        </View>
    );
}