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

// Configuration
let theme = DarkTheme;

export default function RootLayout() {
    const [state, controller] = useNewGlobalController();
    return (
        <ThemeProvider value={theme}>
            <PostHogProvider client={posthog}>
                <GlobalStateContext.Provider value={state}>
                    <GlobalStateControllerContext.Provider value={controller}>
                        <Navigator>
                            <Slot />
                        </Navigator>
                    </GlobalStateControllerContext.Provider>
                </GlobalStateContext.Provider>
            </PostHogProvider>
        </ThemeProvider>
    );
}