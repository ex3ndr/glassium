import { useRoute } from '@react-navigation/native';
import * as React from 'react';
import { Image, Text, View } from 'react-native';
import { Memory } from '../../modules/api/schema';
import { Theme } from '../../theme';

export const MemoryScreen = React.memo(() => {
    let memory = (useRoute().params as any).data as Memory;
    return (
        <View style={{ flexGrow: 1, backgroundColor: Theme.background }}>
            {memory.image && <Image style={{ height: 256 }} source={{ uri: memory.image }} />}
            {!memory.image && <View style={{ height: 16 }} />}
            <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0, marginLeft: 16, paddingTop: 16, paddingHorizontal: 16 }}>
                <Text style={{ fontSize: 24, marginBottom: 16 }}>{memory.title}</Text>
                <Text style={{ fontSize: 16, opacity: 0.7 }}>{memory.summary}</Text>
            </View>
        </View>
    );
});