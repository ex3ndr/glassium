import { DrawerButton } from "@/app/components/DrawerButton";
import { Theme } from "@/app/theme";
import { Stack } from "expo-router";

export default function AppLayout() {
    return (
        <Stack
            screenOptions={{
                headerShadowVisible: false,
                headerTintColor: Theme.text,
                headerBackTitle: 'Back',
                headerBackVisible: true, // Broken in web
                headerLeft: (p) => <DrawerButton canGoBack={p.canGoBack} />,
            }}
        >
            <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
            <Stack.Screen name="settings/device" options={{ title: 'Device' }} />
            <Stack.Screen name="settings/voice_sample" options={{ title: 'Voice Sample' }} />
            <Stack.Screen name="memory/[id]" options={{ title: 'Memory' }} />
            <Stack.Screen name="data/transcripts/index" options={{ title: 'Transcripts' }} />
            <Stack.Screen name="data/sessions/index" options={{ title: 'Sessions' }} />
            <Stack.Screen name="data/sessions/[id]" options={{ title: 'Session' }} />
            <Stack.Screen name="debug/index" options={{ title: 'Debug Tools' }} />
            <Stack.Screen name="debug/logs" options={{ title: 'Debug Logs' }} />
        </Stack>
    )
}