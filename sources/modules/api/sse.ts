import EventSource, { EventSourceListener } from "react-native-sse";
import { log } from "@/utils/logs";

export function sse(url: string, token: string, handler: (update: any) => void) {

    let source: EventSource | null = null;
    let closed = false;

    function reconnect() {
        log('SSE', 'Connecting to ' + url);

        // Check if closed
        if (closed) {
            return;
        }

        // Connect
        source = new EventSource(url, {
            debug: true,
            headers: {
                Authorization: `Bearer ${token}`
            },
        });

        // Listen
        const listener: EventSourceListener = (event) => {
            log('SSE', event.type + ':' + (event as any).data);
            if (event.type === 'message' && event.data) {
                handler(event.data);
            }
            if (event.type === 'error') {

                let delay = Math.floor(Math.random() * 3000 + 1000);

                log('SSE', 'Error received, reconnecting in ' + delay + ' ms');

                // Cleanup and reconnect
                if (source) {
                    source.removeAllEventListeners();
                    source.close();
                    source = null;
                }

                // Reconnect
                setTimeout(reconnect, delay);
            }
        };
        source.addEventListener("message", listener);
        source.addEventListener("open", listener);
        source.addEventListener("close", listener);
        source.addEventListener("error", listener);
    }

    reconnect();

    // Cleanup
    return () => {
        if (!closed) {
            closed = true;
            if (source) {
                source.removeAllEventListeners();
                source.close();
                source = null;
            }
        }
    };
}
