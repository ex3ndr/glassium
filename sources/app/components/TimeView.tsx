import * as React from 'react';
import { Text } from 'react-native';
import { formatDistance } from 'date-fns';

function useTime(time: number, currentTime: number): { title: string, retry: number } {

    // If the time is in the future, we should retry in 30 seconds
    if (time >= currentTime) {
        return { title: 'now', retry: 30 };
    }

    return { title: formatDistance(time, currentTime, { addSuffix: true }), retry: 60 };
}

export const TimeView = React.memo((props: { time: number }) => {
    let time = useTime(props.time, Date.now());

    return (
        <Text>{time.title}</Text>
    );
});