import { getAppModel, useGlobalState } from "@/global";
import { Redirect, Stack } from "expo-router";
import { Provider } from 'jotai';

export default function AppLayout() {
    const state = useGlobalState();
    if (state.kind === 'onboarding') {
        return <Redirect href="(onboarding)" />;
    }
    if (state.kind === 'empty') {
        return <Redirect href="(auth)" />;
    }
    return (
        <Provider store={getAppModel().jotai}>
            <Stack
                screenOptions={{
                    title: '',
                    headerShadowVisible: false,
                    headerBackTitle: 'Back',
                    headerTintColor: '#fff'
                }}
            />
        </Provider>
    );
}