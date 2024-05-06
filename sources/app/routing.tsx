import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import { CountryPicker } from './auth/CountryScreen';
import { Splash } from './Splash';
import { PhoneScreen } from './auth/PhoneScreen';
import { CodeScreen } from './auth/CodeScreen';
import { OnboardingState } from '../global';
import { PreUsernameScreen } from './pre/PreUsername';
import { PrePreparingScreen } from './pre/PrePreparing';
import { RootScreen } from './Root';
import { PreNameScreen } from './pre/PreName';
import { PreNotificationsScreen } from './pre/PreNotifications';
import { PreActivationScreen } from './pre/PreActivation';
import { SessionScreen } from './home/settings/Session';
import { SettingsManageDevice } from './home/settings/SettingsManageDevice';
import { SessionsScreens } from './home/SessionsScreen';
import { MemoryScreen } from './memories/MemoryScreen';
import { LogsScreen } from './dev/LogsScreen';
import { Platform } from 'react-native';
import { DevScreen } from './dev/DevScreen';
import { NewThreadScreen } from './magic/NewThreadScreen';

export const Stack = createNativeStackNavigator();

export const App = (
    <>
        <Stack.Screen
            name='root'
            component={RootScreen}
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name='session'
            component={SessionScreen}
            options={{ title: 'Session' }}
        />
        <Stack.Screen
            name='sessions'
            component={SessionsScreens}
            options={{ title: 'Sessions' }}
        />
        <Stack.Screen
            name='manage-device'
            component={SettingsManageDevice}
            options={{ title: 'Device Management', presentation: Platform.OS === 'ios' ? 'formSheet' : 'card' }}
        />
        <Stack.Screen
            name='memory'
            component={MemoryScreen}
            options={{ headerShown: Platform.OS !== 'ios', presentation: Platform.OS === 'ios' ? 'formSheet' : 'card' }}
        />
        <Stack.Screen
            name='logs'
            component={LogsScreen}
            options={{ title: 'Logs' }}
        />
        <Stack.Screen
            name='dev'
            component={DevScreen}
            options={{ title: 'Developer' }}
        />
        <Stack.Screen
            name='new-thread'
            component={NewThreadScreen}
            options={{ title: 'Thread', presentation: Platform.OS === 'ios' ? 'formSheet' : 'card' }}
        />
    </>
);

export const Pre = (state: OnboardingState) => {
    if (state.kind === 'prepare') {
        return (
            <Stack.Screen
                name='prepare'
                component={PrePreparingScreen}
                options={{
                    headerShown: false
                }}
            />
        );
    }
    if (state.kind === 'need_username') {
        return (
            <Stack.Screen
                name='need_username'
                component={PreUsernameScreen}
                options={{
                    headerShown: false
                }}
            />
        );
    }
    if (state.kind === 'need_name') {
        return (
            <Stack.Screen
                name='need_name'
                component={PreNameScreen}
                options={{
                    headerShown: false
                }}
            />
        );
    }
    if (state.kind === 'need_push') {
        return (
            <Stack.Screen
                name='need_push'
                component={PreNotificationsScreen}
                options={{
                    headerShown: false
                }}
            />
        );
    }
    if (state.kind === 'need_activation') {
        return (
            <Stack.Screen
                name='need_activation'
                component={PreActivationScreen}
                options={{
                    headerShown: false
                }}
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
                headerShown: false
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