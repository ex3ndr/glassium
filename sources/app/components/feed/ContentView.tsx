import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Content } from '../../../modules/api/content';
import { useAppModel } from '../../../global';
import { Theme } from '../../theme';
import { AppService } from '../../../modules/services/AppService';
import { Image } from 'expo-image';
import { RoundButton } from '../RoundButton';
import { router } from 'expo-router';

export const ContentView = React.memo((props: { content: Content, app: AppService, display: 'normal' | 'large' }) => {
    if (Array.isArray(props.content)) {
        return (
            <View style={{ flexDirection: 'column' }}>
                {props.content.map((item, index) => (
                    <ContentView key={index} content={item} app={props.app} display={props.display} />
                ))}
            </View>
        )
    }
    if (props.content.kind === 'text') {
        return (
            <ContentText text={props.content.text} display={props.display} />
        )
    }
    if (props.content.kind === 'transcription') {
        return (
            <ContentTranscription transcription={props.content.transcription} display={props.display} />
        );
    }
    if (props.content.kind === 'memory') {
        return (
            <ContentMemory id={props.content.id} display={props.display} />
        );
    }
    return (
        <ContentText text={'Unknown content'} display={props.display} />
    );
});

const ContentMemory = React.memo((props: { id: string, display: 'normal' | 'large' }) => {
    let app = useAppModel();
    let memory = app.memory.use(props.id);

    if (props.display === 'large') {

        let image;
        if (memory.image) {
            image = (
                <Image
                    source={{ uri: memory.image.url }}
                    placeholder={{ thumbhash: memory.image.thumbhash }}
                    style={{ width: 'auto', height: 'auto', aspectRatio: memory.image.width / memory.image.height, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                />
            )
        } else {
            image = <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Theme.warninig }} />
        }

        return (
            <Pressable key={memory.id} style={{ marginHorizontal: 16, marginVertical: 8, borderRadius: 16, borderWidth: 0.5, borderColor: '#272727', flexDirection: 'column' }} onPress={() => router.navigate('/memory/' + props.id)}>
                {image}
                <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0, paddingTop: 8, paddingHorizontal: 8, paddingBottom: 16, backgroundColor: 'white', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
                    <Text style={{ fontSize: 16, color: Theme.textInverted }} numberOfLines={3}>{memory.title}</Text>
                    <Text style={{ fontSize: 14, opacity: 0.6, color: Theme.textInverted }} numberOfLines={2}>{memory.summary.replaceAll('\n', ' ')}</Text>
                </View>
            </Pressable>
        )
    }
    return (
        <View style={{ marginHorizontal: 0, marginVertical: 4 }}>
            <Text style={{ color: Theme.text, fontStyle: 'italic' }}>New memory: <Text style={{ fontWeight: '600' }}>{memory.title}</Text></Text>
            <View style={{ alignItems: 'flex-start', marginTop: 8 }}>
                <RoundButton size='small' title={'View'} onPress={() => router.navigate('/memory/' + props.id)} />
            </View>
        </View>
    )
});

const ContentText = React.memo((props: { text: string, display: 'normal' | 'large' }) => {
    return (
        <View style={{ marginHorizontal: props.display === 'large' ? 32 : 0, marginVertical: 4 }}>
            <Text style={{ color: Theme.text }}>{props.text}</Text>
        </View>
    )
});

const ContentTranscription = React.memo((props: { transcription: { sender: string, text: string }[] | string, display: 'normal' | 'large' }) => {
    return (
        <View style={{ marginHorizontal: props.display === 'large' ? 32 : 0, marginVertical: 4 }}>
            {typeof props.transcription === 'string' && (
                <Text style={{ color: Theme.text }}>{props.transcription}</Text>
            )}
            {Array.isArray(props.transcription) && (
                <View>
                    {props.transcription.map((item, index) => (
                        <View key={index}>
                            <Text style={{ color: Theme.text }}>{item.sender}</Text>
                            <Text style={{ color: Theme.text }}>{item.text}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    )
});