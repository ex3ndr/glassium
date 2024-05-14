import { useGlobalState } from "@/global";
import { Redirect, Slot, Stack } from "expo-router";

export default function AppLayout() {
    const state = useGlobalState();
    if (state.kind === 'empty') {
        return <Redirect href="/(auth)" />;
    }
    if (state.kind === 'ready') {
        return <Redirect href="/(app)" />;
    }
    return (
        <Stack screenOptions={{ headerBackVisible: false, headerShown: false }} />
    );
}