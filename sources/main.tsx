import * as React from 'react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { Splash } from './app/Splash';
import { PhoneScreen } from './app/auth/PhoneScreen';
import { Theme } from './theme';

const Stack = createNativeStackNavigator();

export function Boot() {
    return (
        <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}>
            <SafeAreaProvider initialMetrics={initialWindowMetrics}>
                <NavigationContainer>
                    <Stack.Navigator
                        screenOptions={{
                            headerShadowVisible: false,
                            headerBackTitle: 'Back',
                            headerTintColor: Theme.accent,
                            title: ''
                        }}
                    >
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

                    </Stack.Navigator>
                </NavigationContainer>
            </SafeAreaProvider>
        </View>
    );
}