import * as React from 'react';
import { Text } from 'react-native';
import { formatDistance } from 'date-fns';

function useTime(time: number, currentTime: number): { title: string, retry: number } {

    // If the time is in the future, we should retry in 30 seconds
    if (time >= currentTime) {
        return { title: 'now', retry: 30 };
    }

    // If time in last 60 seconds, we should retry in 1 second
    if (currentTime - time < 60 * 1000) {
        return { title: 'now', retry: 1 };
    }

    // If time in last 1 hour, we should retry in 1 minute
    if (currentTime - time < 60 * 60 * 1000) {
        return { title: formatDistance(time, currentTime, { addSuffix: true }), retry: 60 };
    }

    // Everything else, we should retry in 15 minutes
    return { title: formatDistance(time, currentTime, { addSuffix: true }), retry: 15 * 60 };
}

export const TimeView = React.memo((props: { time: number }) => {
    let [now, setNow] = React.useState(Date.now());
    let time = useTime(props.time, now);
    React.useEffect(() => {
        let tm = setTimeout(() => {
            setNow(Date.now());
        }, now + time.retry * 1000 - Date.now());
        return () => clearTimeout(tm);
    }, [now + time.retry])

    return (
        <Text>{time.title}</Text>
    );
});