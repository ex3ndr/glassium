import * as React from 'react';
import { AppModel } from "../../../modules/state/AppModel";
import { FeedViewItem } from "../../../modules/state/FeedService";
import { Text, View } from 'react-native';
import { Theme } from '../../../theme';
import { Image } from 'expo-image';
import { TimeView } from '../../components/TimeView';

export const FeedItemComponent = React.memo((props: { item: FeedViewItem, app: AppModel }) => {
    let app = props.app;
    let by = app.users.use(props.item.by);
    let image: any = null;
    if (by.username === 'transcribe') {
        image = require('../../assets/avatar_transcribe.png')
    } else if (by.username === 'overlord') {
        image = require('../../assets/avatar_overlord.png')
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
                    <Text style={{ color: Theme.text }}><TimeView time={props.item.date} /></Text>
                </View>
                {props.item.content.kind === 'text' && (
                    <ContentText text={props.item.content.text} />
                )}
                {props.item.content.kind === 'transcription' && (
                    <ContentTranscription transcription={props.item.content.transcription} />
                )}
                {props.item.content.kind === 'unknown' && (
                    <ContentText text={'Unknown content'} />
                )}
            </View>
        </View>
    );
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