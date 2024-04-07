import EventSource, { EventSourceListener } from "react-native-sse";

export function sse(url: string, token: string) {

    // Source
    let source = new EventSource(url, {
        headers: {
            Authorization: `Bearer ${token}`
        },
    });

    // Handler
    const listener: EventSourceListener = (event) => {
        console.warn(event);
    };
    source.addEventListener("message", listener);
    source.addEventListener("open", listener);
    source.addEventListener("close", listener);
    source.addEventListener("error", listener);

    // Cleanup
    return () => {
        source.removeAllEventListeners();
        source.close();
    };
}
