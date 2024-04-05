import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import { CountryPicker } from './auth/CountryScreen';
import { Splash } from './Splash';
import { PhoneScreen } from './auth/PhoneScreen';
import { CodeScreen } from './auth/CodeScreen';
import { OnboardingState } from '../global';
import { PreUsernameScreen } from './pre/PreUsername';
import { PrePreparingScreen } from './pre/PrePreparing';
import { HomeScreen } from './Home';

export const Stack = createNativeStackNavigator();

export const App = (
    <>
        <Stack.Screen
            name='home'
            component={HomeScreen}
        />
    </>
);

export const Pre = (state: OnboardingState) => {
    if (state.kind === 'prepare') {
        return (
            <Stack.Screen
                name='prepare'
                component={PrePreparingScreen}
            />
        );
    }
    if (state.kind === 'need_username') {
        return (
            <Stack.Screen
                name='need_username'
                component={PreUsernameScreen}
            />
        );
    }
    return null;
}

export const Auth = (
    <>
        <Stack.Screen
            name='splash'
            component={Splash}
            options={{
                headerShown: false,
                statusBarStyle: 'light'
            }}
        />
        <Stack.Screen
            name='phone'
            component={PhoneScreen}
        />
        <Stack.Screen
            name='code'
            component={CodeScreen}
        />
    </>
);

export const Modals = (
    <>
        <Stack.Screen
            name='country'
            component={CountryPicker}
            options={{ headerShown: false }}
        />
    </>
);