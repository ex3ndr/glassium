import { atom, useAtomValue } from "jotai";
import { BackendClient } from "../api/client";
import { FeedViewItem } from "./FeedService";
import { Jotai } from "./_types";
import { InvalidateSync } from "../../utils/sync";
import { log } from "../../utils/logs";
import { UserService } from "./UserService";
import { UpdateFeed } from "../api/schema";
import { uptime } from "../../utils/uptime";
import { MemoryService } from "./MemoryService";
import { Content } from "../api/content";

export class FeedConnectionService {
    readonly id: string;
    readonly client: BackendClient;
    readonly jotai: Jotai;
    readonly users: UserService;
    readonly memories: MemoryService;

    // Sync
    #sync: InvalidateSync;

    // Internal state
    #seqno: number | null = null;
    #items: FeedViewItem[] = [];
    #atom = atom<{ items: FeedViewItem[], next: number | null } | null>(null);
    #next: number | null = null;
    #needMore = false;
    #pending: UpdateFeed[] = [];

    constructor(id: string, users: UserService, memories: MemoryService, client: BackendClient, jotai: Jotai) {
        this.id = id;
        this.client = client;
        this.jotai = jotai;
        this.users = users;
        this.memories = memories;
        this.#sync = new InvalidateSync(this.#doSync);
        this.#sync.invalidate();
        setInterval(() => this.#sync.invalidate(), 5000);
    }

    onReachedEnd = (next: number | null) => {
        if (next !== null && this.#next === next) {
            this.#needMore = true;
            this.#sync.invalidate();
        }
    }

    //
    // Sync
    //

    onUpdate = (update: UpdateFeed) => {
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
        let initialList = await this.client.getFeedList({ source: this.id, before: null, after: null });

        // Assume users
        await this.#assumeHistoryEntities(initialList.items);

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

            // Load pending (to avoid race conditions)
            let picked = [...this.#pending];
            this.#pending = [];

            // Assume entities
            await this.#assumeUpdateEntities(picked);

            // Apply update
            for (let i of picked) {
                await this.#applyUpdate(i);
            }
        }
    }

    #doSyncLoadMore = async () => {

        // Check if needed
        if (!this.#needMore || this.#next === null) {
            return;
        }

        // Load next
        let start = uptime();
        let loaded = await this.client.getFeedList({ source: this.id, before: this.#next, after: null });

        // Assume entities
        await this.#assumeHistoryEntities(loaded.items);

        // Merge with existing
        let added: FeedViewItem[] = [];
        log('FDD', 'FeedService: Loaded ' + loaded.items.length + ' items in ' + (uptime() - start) + ' ms');
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

    #applyUpdate = async (update: UpdateFeed) => {

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

    //
    // Entities
    //

    #assumeHistoryEntities = async (items: { by: string, content: Content }[]) => {

        // Extract content entities
        let contents: Content[] = items.map((v) => v.content);
        let { users, memories } = this.#collectContentEntities(contents);

        // Extract users from update
        for (let u of items) {
            users.add(u.by);
        }

        // Assume
        await this.users.assumeUsers(Array.from(users));
        await this.memories.assumeMemories(Array.from(memories));
    }

    #assumeUpdateEntities = async (updates: UpdateFeed[]) => {

        // Extract content entities
        let contents: Content[] = [];
        for (let u of updates) {
            if (u.type === 'feed-posted') {
                contents.push(u.content);
            }
        }
        let { users, memories } = this.#collectContentEntities(contents);

        // Extract users from update
        for (let u of updates) {
            if (u.type === 'feed-posted') {
                users.add(u.by);
            }
        }

        // Assume
        await this.users.assumeUsers(Array.from(users));
        await this.memories.assumeMemories(Array.from(memories));
    }

    #collectContentEntities = (items: Content[]) => {
        let users = new Set<string>();
        let memories = new Set<string>();

        for (let i of items) {
            if (Array.isArray(i)) {
                let inner = this.#collectContentEntities(i);

                // TODO: Faster?
                users = new Set([...users, ...inner.users]);
                memories = new Set([...memories, ...inner.memories]);
            } else {
                if (i.kind === 'memory') {
                    memories.add(i.id);
                }
            }
        }

        return { users, memories };
    }

    //
    // Public
    //

    use() {
        return useAtomValue(this.#atom);
    }
}