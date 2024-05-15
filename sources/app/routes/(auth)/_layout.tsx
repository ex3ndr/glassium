import { Theme } from "@/app/theme";
import { useGlobalState } from "@/global";
import { Redirect, Stack } from "expo-router";
import { Platform } from "react-native";

export default function AppLayout() {
    const state = useGlobalState();
    if (state.kind === 'onboarding') {
        return <Redirect href="/(onboarding)" />;
    }
    if (state.kind === 'ready') {
        return <Redirect href="/(app)/(screens)/" />;
    }
    return (
        <Stack
            screenOptions={{
                title: '',
                headerShadowVisible: false,
                headerBackTitle: 'Back',
                headerTintColor: '#fff',
                headerStyle: {
                    backgroundColor: Theme.background
                }
            }}
        >
            <Stack.Screen name="auth/phone" />
            <Stack.Screen name="auth/country"
                options={{
                    presentation: Platform.OS === 'ios' ? 'modal' : 'card',
                    headerShown: Platform.OS === 'ios' ? false : true,
                    title: 'Select Country',
                }}
            />
        </Stack>
    );
}