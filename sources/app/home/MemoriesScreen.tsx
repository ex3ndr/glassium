import * as React from 'react';
import { Text, View } from 'react-native';
import { useAppModel } from '../../global';

export const MemoriesScreen = React.memo(() => {
    const app = useAppModel();
    const realtime = app.realtime.use();
    console.warn(realtime);
    return (
        <View>
            <Text>Realtime</Text>
            <Text>{realtime}</Text>
        </View>
    );
});