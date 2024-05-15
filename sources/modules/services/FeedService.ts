import { BackendClient } from "../api/client";
import { UserService } from "./UserService";
import { Jotai } from "./_types";
import { Content } from "../api/content";
import { FeedConnectionService } from "./FeedConnectionService";
import { UpdateFeedPosted } from "../api/schema";
import { MemoryService } from "./MemoryService";

export type FeedViewItem = {
    seq: number;
    date: number;
    content: Content;
    by: string;
};

export type FeedState = {
    items: FeedViewItem[];
    next: number | null;
} | null;

export class FeedService {
    readonly client: BackendClient;
    readonly users: UserService;
    readonly memories: MemoryService;
    readonly jotai: Jotai;
    #feeds = new Map<string, FeedConnectionService>();

    constructor(client: BackendClient, jotai: Jotai, users: UserService, memories: MemoryService) {
        this.client = client;
        this.jotai = jotai;
        this.users = users;
        this.memories = memories;
        this.#feeds.set('default', new FeedConnectionService('default', users, memories, client, jotai));
        this.#feeds.set('smart', new FeedConnectionService('smart', users, memories, client, jotai));
        this.#feeds.set('ai', new FeedConnectionService('ai', users, memories, client, jotai));
    }

    onUpdate = (update: UpdateFeedPosted) => {
        let svc = this.#feeds.get(update.source);
        if (svc) {
            svc.onUpdate(update);
        }
    };

    onReachedEnd = (feed: string, next: number | null) => {
        let svc = this.#feeds.get(feed);
        if (svc) {
            svc.onReachedEnd(next);
        }
    }

    use(feed: 'default' | string): FeedState {
        if (!this.#feeds.has(feed)) {
            this.#feeds.set(feed, new FeedConnectionService(feed, this.users, this.memories, this.client, this.jotai));
        }
        return this.#feeds.get(feed)!.use();
    }
}