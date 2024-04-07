import * as React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { RoundButton } from './components/RoundButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../theme';
import { useAppModel } from '../global';

export const HomeScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const appModel = useAppModel();
    const sessions = appModel.useSessions();
    const wearable = appModel.useWearable();
    return (
        <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingTop: safeArea.top, paddingBottom: safeArea.bottom }}>
            <View style={{ height: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                <View style={{ flexGrow: 1, flexBasis: 0 }} />
                <Text style={{ color: Theme.text, fontSize: 24 }}>Super</Text>
                <View style={{ flexGrow: 1, flexBasis: 0 }}>
                    <Text>{wearable.status}</Text>
                </View>
            </View>
            {sessions === null && (
                <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={Theme.accent} />
                </View>
            )}
            {sessions !== null && sessions.length === 0 && (
                <View style={{ flexGrow: 1 }}>
                    <Text>Press record button to start!</Text>
                </View>
            )}
            {sessions !== null && sessions.length > 0 && (
                <ScrollView style={{ flexGrow: 1, alignSelf: 'stretch' }} contentContainerStyle={{ alignItems: 'stretch' }}>
                    {sessions.map((session) => (
                        <Pressable
                            key={session.id}
                            style={{
                                backgroundColor: 'white',
                                marginHorizontal: 16,
                                marginVertical: 8,
                                borderRadius: 16,
                                paddingHorizontal: 16,
                                paddingVertical: 18,
                                flexDirection: 'row'
                            }}
                        >
                            <Text style={{ color: 'black', fontSize: 24, flexGrow: 1, flexBasis: 0, alignSelf: 'center' }}>Session #{(session.index + 1)}</Text>
                            <Text style={{ color: 'black', alignSelf: 'center' }}>{session.state}</Text>
                        </Pressable>
                    ))}
                </ScrollView>
            )}
            <RoundButton title="Record" onPress={() => appModel.startSession()} />
        </View>
    );
});