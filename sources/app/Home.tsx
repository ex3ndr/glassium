import * as React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { RoundButton } from './components/RoundButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../theme';
import { useAppModel } from '../global';
import { useRouter } from '../routing';

export const HomeScreen = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const appModel = useAppModel();
    const sessions = appModel.useSessions();
    const wearable = appModel.useWearable();
    const router = useRouter();
    return (
        <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingTop: safeArea.top, paddingBottom: safeArea.bottom, backgroundColor: Theme.background }}>
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
                <ScrollView style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }} contentContainerStyle={{ alignItems: 'stretch' }}>
                    {sessions.map((session) => (
                        <Pressable
                            key={session.id}
                            style={{
                                backgroundColor: '#eee',
                                marginHorizontal: 16,
                                marginVertical: 8,
                                borderRadius: 16,
                                paddingHorizontal: 16,
                                paddingVertical: 18,
                                flexDirection: 'row'
                            }}
                            onPress={() => { router.navigate('session', { id: session.id }) }}
                        >
                            <Text style={{ color: 'black', fontSize: 24, flexGrow: 1, flexBasis: 0, alignSelf: 'center' }}>Session #{(session.index + 1)}</Text>
                            <Text style={{ color: 'black', alignSelf: 'center' }}>{session.state}</Text>
                            <Text>{session.audio ? (session.audio.duration / 1000).toString() : ''}</Text>
                        </Pressable>
                    ))}
                </ScrollView>
            )}
            <View style={{ position: 'absolute', left: 0, bottom: safeArea.bottom, right: 0, alignItems: 'center', justifyContent: 'center' }}>
                <RoundButton title="Record" onPress={() => appModel.startSession()} />
            </View>
        </View>
    );
});