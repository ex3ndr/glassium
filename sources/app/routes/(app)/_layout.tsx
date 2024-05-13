import { useGlobalState } from "@/global";
import { Redirect, Stack } from "expo-router";

export default function AppLayout() {
    const state = useGlobalState();
    if (state.kind === 'onboarding') {
        return <Redirect href="(onboarding)" />;
    }
    if (state.kind === 'empty') {
        return <Redirect href="(auth)" />;
    }
    return (
        <Stack />
    );
}