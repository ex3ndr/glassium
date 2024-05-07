import { atom, useAtomValue } from "jotai";
import { BubbleClient } from "../api/client";
import { FeedViewItem } from "./FeedService";
import { Jotai } from "./_types";
import { InvalidateSync } from "../../utils/sync";
import { log } from "../../utils/logs";
import { UserService } from "./UserService";
import { UpdateFeedPosted } from "../api/schema";

export class FeedConnectionService {
    readonly id: string;
    readonly client: BubbleClient;
    readonly jotai: Jotai;
    readonly users: UserService;

    // Sync
    #sync: InvalidateSync;

    // Internal state
    #seqno: number | null = null;
    #items: FeedViewItem[] = [];
    #atom = atom<{ items: FeedViewItem[], next: number | null } | null>(null);
    #next: number | null = null;
    #needMore = false;
    #pending: UpdateFeedPosted[] = [];

    constructor(id: string, users: UserService, client: BubbleClient, jotai: Jotai) {
        this.id = id;
        this.client = client;
        this.jotai = jotai;
        this.users = users;
        this.#sync = new InvalidateSync(this.#doSync);
        this.#sync.invalidate();
        setInterval(() => this.#sync.invalidate(), 5000);
    }

    onReachedEnd = (next: number | null) => {
        if (next !== null && this.#next === next) {
            this.#needMore = true;
        }
    }

    //
    // Sync
    //

    onUpdate = (update: UpdateFeedPosted) => {
        this.#pending.push(update);
        this.#sync.invalidate();
    }

    #doSync = async () => {

        // Initial sync if needed
        await this.#doSyncInitial();

        // Pending sync
        await this.#doSyncPending();

        // Load more
        await this.#doSyncLoadMore();
    }

    #doSyncInitial = async () => {

        // Load the last seqno
        if (this.#seqno !== null) {
            return;
        }

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
        this.#seqno = seqno;
        this.#next = initialList.next;
        this.jotai.set(this.#atom, { items: this.#items, next: this.#next });
    }

    #doSyncPending = async () => {
        while (this.#pending.length > 0) {
            await this.#applyUpdate(this.#pending.shift()!);
        }
    }

    #doSyncLoadMore = async () => {

        // Check if needed
        if (!this.#needMore || this.#next === null) {
            return;
        }

        // Load next
        let loaded = await this.client.getFeedList(this.#next);

        // Assume users
        await this.users.assumeUsers(loaded.items.map((v) => v.by));

        // Merge with existing
        let added: FeedViewItem[] = [];
        log('FDD', 'FeedService: Loaded ' + loaded.items.length + ' items');
        for (let u of loaded.items) {
            log('FDD', 'FeedService: Item ' + u.seq + ' at ' + u.date + ' by ' + u.by + ' with content ' + JSON.stringify(u.content));

            // Check if exists
            if (this.#items.find((v) => v.seq === u.seq)) {
                continue;
            }

            // Add to feed
            added.push(u);
        }

        // Update UI
        this.#items = this.#items.concat(added);
        this.#next = loaded.next;
        this.jotai.set(this.#atom, { items: this.#items, next: this.#next });
    }

    // #doSyncDelta = async () => {

    //     // Should not happen
    //     if (this.#seqno === null) {
    //         return;
    //     }

    //     // Detect update
    //     let seqno = await this.client.getFeedSeq();
    //     if (seqno <= this.#seqno) {
    //         return;
    //     }

    //     // Load missing items
    //     let loaded: FeedViewItem[] = [];
    //     let last: number | null = null;
    //     outer: while (true) {

    //         // Load new feed
    //         let updated = await this.client.getFeedList(last);

    //         // Assume users
    //         await this.users.assumeUsers(updated.items.map((v) => v.by));

    //         // Merge with existing
    //         log('FDD', 'FeedService: Loaded ' + updated.items.length + ' items');
    //         for (let u of updated.items) {
    //             if (u.seq < this.#seqno) {
    //                 break outer;
    //             }
    //             log('FDD', 'FeedService: Item ' + u.seq + ' at ' + u.date + ' by ' + u.by + ' with content ' + JSON.stringify(u.content));
    //             loaded.push(u);
    //         }
    //     }

    //     // Merge
    //     this.#items = loaded.concat(this.#items);
    //     this.#seqno = seqno;
    //     this.jotai.set(this.#atom, { items: this.#items, next: this.#next });
    // }

    #applyUpdate = async (update: UpdateFeedPosted) => {

        // Assume users
        await this.users.assumeUsers([update.by]);

        // Append to feed
        if (update.type === 'feed-posted') {

            // Check if exists
            if (this.#items.find((v) => v.seq === update.seq)) {
                return;
            }

            // Append to feed
            let item: FeedViewItem = {
                seq: update.seq,
                date: update.date,
                content: update.content,
                by: update.by
            };
            this.#items = [item].concat(this.#items); // NOTE: we always appending to the beginning to avoid jumps in UI

            // Update UI
            this.jotai.set(this.#atom, { items: this.#items, next: this.#next });
            return;
        }
    }

    use() {
        return useAtomValue(this.#atom);
    }
}