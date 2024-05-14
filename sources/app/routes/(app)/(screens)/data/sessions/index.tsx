import * as React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { ViewSession } from '@/modules/services/SessionsModel';
import { Theme } from '@/app/theme';
import { useAppModel } from '@/global';

const SessionComponent = React.memo((props: { session: ViewSession }) => {
    let status: string = props.session.state;
    if (props.session.classification === 'boring') {
        status = 'boring 🥱';
    } else if (props.session.classification === 'important') {
        status = 'important 🤩';
    } else if (props.session.classification === 'broken') {
        status = 'broken 🚧';
    } else if (props.session.classification === 'empty') {
        status = 'empty 🤔';
    }
    return (
        <Pressable
            style={(p) => ({
                backgroundColor: p.pressed ? '#111111' : '#1c1c1c',
                marginHorizontal: 16,
                marginVertical: 8,
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 18,
                flexDirection: 'row'
            })}
            onPress={() => { router.navigate('/data/sessions/' + props.session.id) }}
        >
            <Text style={{ color: Theme.text, fontSize: 24, flexGrow: 1, flexBasis: 0, alignSelf: 'center' }}>Session #{(props.session.index + 1)}</Text>
            <Text style={{ color: Theme.text, alignSelf: 'center' }}>{status}</Text>
        </Pressable>
    );
});

export default React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const appModel = useAppModel();
    const sessions = appModel.useSessions();

    return (
        <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.background }}>
            {sessions === null && (
                <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: safeArea.bottom, }}>
                    <ActivityIndicator size="large" color={Theme.accent} />
                </View>
            )}
            {sessions !== null && sessions.length === 0 && (
                <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}>
                    <Text>No sessions</Text>
                </View>
            )}
            {sessions !== null && sessions.length > 0 && (
                <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}>
                    <FlashList
                        contentContainerStyle={{ paddingBottom: safeArea.bottom + 64 }}
                        data={sessions}
                        renderItem={({ item }) => <SessionComponent key={item.id} session={item} />}
                        estimatedItemSize={80}
                        keyExtractor={(item) => item.id}
                    />
                </View>
            )}
        </View>
    );
});