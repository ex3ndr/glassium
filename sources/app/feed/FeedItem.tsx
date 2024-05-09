import * as React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Theme } from '../../theme';
import { TimeView } from '../components/TimeView';
import { Content } from '../../modules/api/content';
import { FeedViewItem } from '../../modules/services/FeedService';
import { AppService } from '../../modules/services/AppService';
import { useAppModel } from '../../global';

export const FeedItemComponent = React.memo((props: { item: FeedViewItem, app: AppService }) => {
    let app = props.app;
    let by = app.users.use(props.item.by);
    let image: any = null;
    if (by.username === 'transcribe') {
        image = require('../assets/avatar_transcribe.png')
    } else if (by.username === 'overlord') {
        image = require('../assets/avatar_overlord.png')
    }else if (by.username === 'memory') {
        image = require('../assets/avatar_memory.png')
    }
    return (
        <View style={{ marginHorizontal: 8, flexDirection: 'row', marginVertical: 4 }}>
            {image === null && (
                <View style={{ width: 32, height: 32, borderRadius: 32 }}>
                </View>
            )}
            {image !== null && (
                <Image source={image} style={{ width: 32, height: 32, borderRadius: 32 }} />
            )}
            <View style={{ flexDirection: 'column', flex: 1, marginLeft: 8 }}>
                <View style={{ flexDirection: 'row' }}>
                    <Text style={{ color: Theme.text }}>{by.firstName} <Text style={{ opacity: 0.7 }}>@{by.username}</Text></Text>
                    <View style={{ flex: 1 }} />
                    <Text style={{ color: Theme.text, opacity: 0.4 }}><TimeView time={props.item.date} /></Text>
                </View>
                <ContentView content={props.item.content} />
            </View>
        </View>
    );
});

const ContentView = React.memo((props: { content: Content }) => {
    if (Array.isArray(props.content)) {
        return (
            <View style={{ flexDirection: 'column' }}>
                {props.content.map((item, index) => (
                    <ContentView key={index} content={item} />
                ))}
            </View>
        )
    }
    if (props.content.kind === 'text') {
        return (
            <ContentText text={props.content.text} />
        )
    }
    if (props.content.kind === 'transcription') {
        return (
            <ContentTranscription transcription={props.content.transcription} />
        );
    }
    if (props.content.kind === 'memory') {
        return (
            <ContentMemory id={props.content.id} />
        );
    }
    return (
        <ContentText text={'Unknown content'} />
    );
});

const ContentMemory = React.memo((props: { id: string }) => {
    let app = useAppModel();
    let memory = app.memory.use(props.id).title;
    return (
        <View>
            <Text style={{ color: Theme.text, fontStyle: 'italic' }}>New memory: <Text style={{ fontWeight: '600' }}>{memory}</Text></Text>
        </View>
    )
});

const ContentText = React.memo((props: { text: string }) => {
    return (
        <View>
            <Text style={{ color: Theme.text }}>{props.text}</Text>
        </View>
    )
});

const ContentTranscription = React.memo((props: { transcription: { sender: string, text: string }[] | string }) => {
    return (
        <View>
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