import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from '../../routing';
import { Item } from '../components/Item';

export const SettingsScreen = React.memo(() => {
    const router = useRouter();
    return (
        <View>
            <Item title="Device" />
            <Pressable
                style={{
                    backgroundColor: '#eee',
                    marginHorizontal: 16,
                    marginVertical: 8,
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 18,
                    flexDirection: 'row'
                }}
                onPress={() => { router.navigate('manage-device') }}
            >
                <Text style={{ color: 'black', fontSize: 24, flexGrow: 1, flexBasis: 0, alignSelf: 'center' }}>Manage device</Text>
            </Pressable>
            <Item title="Profile" />
            <Pressable
                style={{
                    backgroundColor: '#eee',
                    marginHorizontal: 16,
                    marginVertical: 8,
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 18,
                    flexDirection: 'row'
                }}
                onPress={() => { router.navigate('sessions') }}
            >
                <Text style={{ color: 'black', fontSize: 24, flexGrow: 1, flexBasis: 0, alignSelf: 'center' }}>Sessions</Text>
            </Pressable>
            <Pressable
                style={{
                    backgroundColor: '#eee',
                    marginHorizontal: 16,
                    marginVertical: 8,
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 18,
                    flexDirection: 'row'
                }}
                onPress={() => { router.navigate('sessions') }}
            >
                <Text style={{ color: 'black', fontSize: 24, flexGrow: 1, flexBasis: 0, alignSelf: 'center' }}>Logout</Text>
            </Pressable>
        </View>
    );
});