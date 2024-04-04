import * as React from 'react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { Splash } from './app/Splash';

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
                    </Stack.Navigator>
                </NavigationContainer>
            </SafeAreaProvider>
        </View>
    );
}