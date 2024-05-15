import { DeviceStateView } from '@/app/components/DeviceStateView';
import * as React from 'react';
import { ScrollView, Text, View } from 'react-native';

export default React.memo(() => {
    return (
        <ScrollView contentContainerStyle={{ gap: 8, marginHorizontal: 16 }}>
            <DeviceStateView state={null} />
            <DeviceStateView state={{ paired: true, conencted: true, name: 'Friend', vendor: 'friend' }} />
            <DeviceStateView state={{ paired: true, conencted: false, name: 'Bubble', vendor: 'bubble' }} />
            <DeviceStateView state={{ paired: true, conencted: true, name: 'Bubble', vendor: 'bubble' }} />
        </ ScrollView>
    );
});