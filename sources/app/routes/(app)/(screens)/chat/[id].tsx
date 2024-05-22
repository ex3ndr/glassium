import { ChatFragment } from '@/app/fragments/ChatFragment';
import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';

export default React.memo(() => {
    let id = useLocalSearchParams().id as string;
    return (
        <ChatFragment id={id} />
    );
});