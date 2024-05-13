import { useGlobalState } from "@/global";
import { Redirect, Stack } from "expo-router";

export default function AppLayout() {
    const state = useGlobalState();
    if (state.kind === 'onboarding') {
        return <Redirect href="(onboarding)" />;
    }
    if (state.kind === 'ready') {
        return <Redirect href="(app)" />;
    }
    return (
        <Stack
            screenOptions={{
                title: '',
                headerShadowVisible: false,
                headerBackTitle: 'Back',
                headerTintColor: '#fff',
            }}
        />
    );
}