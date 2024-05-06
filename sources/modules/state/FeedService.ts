import { atom, useAtomValue } from "jotai";
import { log } from "../../utils/logs";
import { InvalidateSync } from "../../utils/sync";
import { BubbleClient } from "../api/client";
import { Content } from "../api/schema";
import { UserService } from "./UserService";
import { Jotai } from "./_types";

export type FeedViewItem = {
    seq: number;
    date: number;
    content: Content;
    by: string;
};

export class FeedService {
    readonly client: BubbleClient;
    readonly users: UserService;
    readonly jotai: Jotai;
    #sync: InvalidateSync;
    #lastSeqno: number | null = null;
    #next: number | null = null;
    #items: FeedViewItem[] = [];
    #atom = atom<{ items: FeedViewItem[], next: number | null } | null>(null);

    constructor(client: BubbleClient, jotai: Jotai, users: UserService) {
        this.client = client;
        this.jotai = jotai;
        this.users = users;
        this.#sync = new InvalidateSync(this.#doSync);
        this.#sync.invalidate();
        setInterval(() => this.#sync.invalidate(), 1000); // For testing
    }

    #doSync = async () => {

        // Load the last seqno
        if (this.#lastSeqno === null) {

            // Load initial seq
            log('FDD', 'FeedService: Initial sync');
            let seqno = await this.client.getFeedSeq();
            log('FDD', 'FeedService: Feed starts at ' + seqno);

            // Load feed
            let initialList = await this.client.getFeedList(null);

            // Assume users
            await this.users.assumeUsers(initialList.items.map((v) => v.by));

            // Lod items
            log('FDD', 'FeedService: Loaded ' + initialList.items.length + ' items');
            for (let i in initialList.items) {
                log('FDD', 'FeedService: Item ' + initialList.items[i].seq + ' at ' + initialList.items[i].date + ' by ' + initialList.items[i].by + ' with content ' + JSON.stringify(initialList.items[i].content));
            }

            // Save
            this.#items = initialList.items;
            this.#lastSeqno = seqno;
            this.#next = initialList.next;
            this.jotai.set(this.#atom, { items: this.#items, next: this.#next });

            // Invalidate sync
            this.#sync.invalidate();
            return;
        }

        // Detect update
        let seqno = await this.client.getFeedSeq();
        if (seqno <= this.#lastSeqno) {
            return;
        }

        // Load missing items
        let loaded: FeedViewItem[] = [];
        let last: number | null = null;
        outer: while (true) {

            // Load new feed
            let updated = await this.client.getFeedList(last);

            // Assume users
            await this.users.assumeUsers(updated.items.map((v) => v.by));

            // Merge with existing
            log('FDD', 'FeedService: Loaded ' + updated.items.length + ' items');
            for (let u of updated.items) {
                if (u.seq < this.#lastSeqno) {
                    break outer;
                }
                log('FDD', 'FeedService: Item ' + u.seq + ' at ' + u.date + ' by ' + u.by + ' with content ' + JSON.stringify(u.content));
                loaded.push(u);
            }
        }

        // Merge
        this.#items = loaded.concat(this.#items);
        this.#lastSeqno = seqno;
        this.jotai.set(this.#atom, { items: this.#items, next: this.#next });
    }

    use() {
        return useAtomValue(this.#atom);
    }
}