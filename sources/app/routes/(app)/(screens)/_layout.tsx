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
        />
    )
}