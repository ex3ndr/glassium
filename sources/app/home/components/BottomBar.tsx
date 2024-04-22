import * as React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../../theme';

const TabBarItem = React.memo((props: { icon: string, active: boolean, title: string, onPress: () => void }) => {
    return (
        <Pressable style={{ flexGrow: 1, flexBasis: 0, justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }} onPress={props.onPress}>
            {/* <Image source={require('../../assets/tab_select.png')} style={{ width: 86, height: 56, position: 'absolute', top: 0, transform: [{ rotateZ: '180deg' }] }} /> */}
            {typeof props.icon === 'string' && (
                <Ionicons name={props.icon as any} size={24} color="black" />
            )}
            {typeof props.icon !== 'string' && (
                <Image source={props.icon} style={{ width: 24, height: 24, opacity: props.active ? 1 : 0.8 }} />
            )}
            <Text style={{ color: props.active ? Theme.text : Theme.textSecondary, fontSize: 14, marginTop: 4 }}>{props.title}</Text>
            {/* {props.active && <View style={{ width: 6, height: 6, borderRadius: 4, backgroundColor: Theme.accent, marginTop: 4, position: 'absolute', top: 4, transform: [{ translateX: 16 }] }}></View>} */}
        </Pressable>
    )
});

const ActionBarItem = React.memo((props: { icon: string, kind: 'normal' | 'warning' | 'active', onPress: () => void }) => {
    return (
        <Pressable style={{ flexGrow: 1, flexBasis: 0, justifyContent: 'center', alignItems: 'center' }} onPress={props.onPress}>
            <Ionicons name={props.icon as any} size={48} color={props.kind === 'warning' ? Theme.accent : (props.kind === 'active' ? 'blue' : 'black')} />
        </Pressable>
    );
});

export const BottomBar = React.memo((props: {
    onPress: (page: 'home' | 'search' | 'sessions' | 'settings') => void,
    active: 'home' | 'search' | 'sessions' | 'settings'
}) => {
    return (
        <View style={{ height: 64, flexDirection: 'row', alignItems: 'stretch', alignSelf: 'stretch', backgroundColor: Theme.background }}>
            {/* <TabBarItem icon={require('../../assets/toolbox_3d.png')} active={props.active === 'search'} title="Devices" onPress={() => props.onPress('search')} /> */}
            <TabBarItem icon={require('../../assets/house_with_garden_3d.png')} active={props.active === 'home'} title="Home" onPress={() => props.onPress('home')} />
            {/* <TabBarItem icon={require('../../assets/magnifying_glass_tilted_left_3d.png')} active={props.active === 'search'} title="Search" onPress={() => props.onPress('search')} /> */}
            {/* <TabBarItem icon="search" active={props.active === 'search'} onPress={() => props.onPress('search')} /> */}
            {/* <ActionBarItem icon={props.actionIcon} kind={props.actionStyle} onPress={props.onActionPress} /> */}
            {/* <TabBarItem icon="stats-chart" active={props.active === 'sessions'} onPress={() => props.onPress('sessions')} /> */}
            <TabBarItem icon={require('../../assets/gear_3d.png')} active={props.active === 'settings'} title="Settings" onPress={() => props.onPress('settings')} />
        </View>
    );
});