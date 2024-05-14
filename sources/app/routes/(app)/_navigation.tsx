import * as React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useLayout } from "@/utils/useLayout";
import { Theme } from '@/app/theme';
import { Image } from 'expo-image';

//
// Sidebar
//

const SidebarButton = (props: { icon: string, title: string, pathname: string }) => {
    const pathName = usePathname();
    return (
        <Pressable
            style={(p) => ({
                backgroundColor: pathName === props.pathname ? 'rgba(255, 255, 255, 0.1)' : (((p as any).hovered || p.pressed) ? 'rgba(255, 255, 255, 0.05)' : 'transparent'),
                borderRadius: 10,
                paddingHorizontal: 16,
                paddingVertical: 16,
                height: 48,
                flexDirection: 'row'
            })}
            onPress={() => router.navigate(props.pathname)}
        >
            <Ionicons name={props.icon as any} size={18} color={Theme.text} />
            <Text style={{ color: Theme.text, fontSize: 16, marginLeft: 8 }}>{props.title}</Text>
        </Pressable>
    )
};

export const Sidebar = () => {
    const layout = useLayout();
    return (
        <View style={{ alignSelf: 'stretch', width: 200, marginHorizontal: 8, gap: 4 }}>
            <View style={{ height: 64, alignItems: 'center', flexDirection: 'row', marginLeft: 8, marginTop: 2 }}>
                <Image source={require('@/app/assets/splash_2.png')} style={{ width: 24, height: 24 }} />
                <Text style={{ color: Theme.text, marginLeft: 12, fontSize: 24 }}>Glassium</Text>
            </View>
            <SidebarButton icon="home-outline" title='Home' pathname='/' />
            {layout === 'large' && (
                <SidebarButton icon="document-text-outline" title='Transcripts' pathname='/data/transcripts' />
            )}
            <SidebarButton icon="cog" title='Settings' pathname='/settings' />
        </View>
    );
};