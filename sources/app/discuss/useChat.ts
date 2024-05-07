import * as React from 'react';
import { AsyncLock } from "../../utils/lock";
import { backoff } from '../../utils/time';

export type ChatMessage = {
    from: string | null;
    state: 'sending' | 'sent' | null;
    text: string;
    date: number;
};

class ChatService {
    #id: string;
    #lock = new AsyncLock();
    #disposed = false;
    #messages: ChatMessage[] = [];
    #dispatcher: React.Dispatch<React.SetStateAction<ChatMessage[]>>

    constructor(id: string, dispatcher: React.Dispatch<React.SetStateAction<ChatMessage[]>>) {
        this.#dispatcher = dispatcher;
        this.#id = id;

        this.#lock.inLock(async () => {
            // TODO: Load messages
        });
    }

    sendMessage(message: string) {
        this.#lock.inLock(async () => {
            if (this.#disposed) {
                return;
            }

            // Append message
            this.#messages.push({
                from: null,
                text: message,
                date: Date.now(),
                state: 'sending'
            });
            this.#dispatcher([...this.#messages]);

            // Inference
            const received = await backoff<ChatMessage | null>(async () => {
                if (this.#disposed) {
                    return null;
                }

                // TODO: Send message
                return null;
            });
            if (!received) {
                return;
            }

            // Update state
            this.#messages[this.#messages.length - 1] = { ...this.#messages[this.#messages.length - 1], state: 'sent' };
            this.#messages = [...this.#messages, received];
            this.#dispatcher([...this.#messages]);
        });
    }

    dispose() {
        if (!this.#disposed) {
            this.#disposed = true;
            this.#lock.inLock(async () => {

            });
        }
    }
}

export function useChat(id: string) {

    // State
    const [messages, setMessages] = React.useState<ChatMessage[]>([]);
    const service = React.useMemo(() => new ChatService(id, setMessages), [id, setMessages]);
    React.useEffect(() => {
        return () => {
            service.dispose();
        };
    }, [service]);

    // Return
    return [messages, service] as const;
}