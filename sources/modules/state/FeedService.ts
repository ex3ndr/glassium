import { BubbleClient } from "../api/client";
import { UserService } from "./UserService";
import { Jotai } from "./_types";
import { Content } from "../api/content";
import { FeedConnectionService } from "./FeedConnectionService";
import { UpdateFeedPosted } from "../api/schema";

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
    readonly client: BubbleClient;
    readonly users: UserService;
    readonly jotai: Jotai;
    #feeds = new Map<string, FeedConnectionService>();

    constructor(client: BubbleClient, jotai: Jotai, users: UserService) {
        this.client = client;
        this.jotai = jotai;
        this.users = users;
        this.#feeds.set('default', new FeedConnectionService('default', users, client, jotai));
    }

    onUpdate = (update: UpdateFeedPosted) => {
        let svc = this.#feeds.get(update.source);
        if (svc) {
            svc.onUpdate(update);
        }
    };

    use(feed: 'default' | string): FeedState {
        if (!this.#feeds.has(feed)) {
            this.#feeds.set(feed, new FeedConnectionService(feed, this.users, this.client, this.jotai));
        }
        return this.#feeds.get(feed)!.use();
    }
}