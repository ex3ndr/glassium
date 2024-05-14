import * as React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigationContainerRef, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useLayout } from "@/utils/useLayout";
import { Theme } from '@/app/theme';
import { Image } from 'expo-image';

//
// Sidebar
//

const SidebarButton = (props: { icon: string, title: string, pathname: string, internal: string }) => {
    const pathName = usePathname();
    const navigation = useNavigationContainerRef();
    function doNavigate() {

        // Try to find the existing key for (app)
        let state = navigation.getState();
        let appKey: string | undefined = undefined;
        if (state.routes.length > 0 && state.routes[0].name === '(app)') {
            appKey = state.routes[0].key;
        }

        // Navigate to the new route
        navigation.reset({
            routes: [{
                name: '(app)',
                key: appKey,
                state: {
                    routes: [{ name: props.internal }]
                }
            }]
        });
    }
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
            onPress={doNavigate}
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
            <SidebarButton icon="home-outline" title='Home' pathname='/' internal="index" />
            {layout === 'large' && (
                <SidebarButton icon="document-text-outline" title='Transcripts' pathname='/data/transcripts' internal="(screens)/data/transcripts/index" />
            )}
            <SidebarButton icon="cog" title='Settings' pathname='/settings' internal='(screens)/settings/index' />
        </View>
    );
};