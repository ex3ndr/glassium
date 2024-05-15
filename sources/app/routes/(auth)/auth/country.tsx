import * as React from 'react';
import { Button, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { Country, countries } from '@/utils/countries';
import { Theme } from '@/app/theme';
import { storage } from '@/storage';
import { router } from 'expo-router';

const Row = React.memo((props: { item: Country, callback: (item: Country) => void }) => {
    return (
        <Pressable style={(props) => ({ opacity: props.pressed ? 0.6 : 1 })} onPress={() => props.callback(props.item)}>
            <View style={{ height: 44, alignItems: 'center', paddingHorizontal: 16, flexDirection: 'row' }}>
                <Text style={{ flexGrow: 1, flexBasis: 0, paddingRight: 16, fontSize: 16, color: Theme.text }}>{props.item.emoji} {props.item.label}</Text>
                <Text style={{ fontSize: 17, color: Theme.text }}>{props.item.value}</Text>
            </View>
        </Pressable>
    );
});

const ListDivider = <View style={{ paddingHorizontal: 16, height: 0.5, flexDirection: 'row' }}><View style={{ flexGrow: 1, height: 0.5, backgroundColor: Theme.divider }} /></View>;

export default function CountryPicker() {
    let [filter, setFilter] = React.useState('');
    let data = React.useMemo(() => {

        // Check if filtering enabled
        let query = filter.trim().toLocaleLowerCase();
        if (query.length === 0) {
            return countries;
        }

        // Filter
        const res: Country[] = [];
        for (let c of countries) {
            if (c.label.toLocaleLowerCase().startsWith(query) || c.value.startsWith(query) || c.value.startsWith('+' + query)) {
                res.push(c);
            }
        }
        return res;
    }, [filter]);
    return (
        <View style={{ flexGrow: 1, alignSelf: 'stretch', alignItems: 'stretch', backgroundColor: Theme.background, flexDirection: 'column' }}>
            <View style={{ paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.background, height: 54 }}>
                <View style={{ flexGrow: 1, flexBasis: 0, backgroundColor: '#E3E3E3', borderRadius: 8, paddingLeft: 8, height: 36, marginTop: 4, flexDirection: 'row' }}>
                    <Ionicons name="search" size={20} color="#8D8D8F" style={{ marginTop: 8 }} />
                    <TextInput
                        style={{ flexGrow: 1, flexBasis: 0, borderRadius: 8, paddingLeft: 6, paddingRight: 12, height: 36, fontSize: 17 }}
                        placeholder='Search'
                        placeholderTextColor="#8D8D8F"
                        autoFocus={true}
                        value={filter}
                        onChangeText={setFilter}
                    />
                </View>
                {Platform.OS === 'ios' && (
                    <View style={{ paddingTop: 4, paddingLeft: 4 }}>
                        <Button title='Cancel' onPress={() => router.back()} color={'#fff'} />
                    </View>
                )}
            </View>
            <View style={{ height: 0.5, backgroundColor: Theme.divider }} />
            <View style={{ flexGrow: 1, flexBasis: 0 }}>
                <FlashList<Country>
                    renderItem={({ item }) => <Row item={item} callback={(i) => {
                        storage.set('auth-country', i.shortname);
                        router.back();
                    }} />}
                    ItemSeparatorComponent={() => ListDivider}
                    ListFooterComponent={data.length > 0 ? () => ListDivider : null}
                    data={data}
                    estimatedItemSize={48}
                    keyboardDismissMode='on-drag'
                    keyboardShouldPersistTaps="handled"
                />
            </View>
        </View>
    );
}