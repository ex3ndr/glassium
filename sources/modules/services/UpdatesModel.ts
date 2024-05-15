import { BackendClient } from "../api/client";
import { Update, Updates } from "../api/schema";
import { storage } from "../../storage";
import { log } from "../../utils/logs";
import { InvalidateSync } from "../../utils/sync";

export class UpdatesModel {
    readonly client: BackendClient;
    #maxKnownSeq: number = 0;
    #seq: number | null = null;
    #sync: InvalidateSync;
    #queue = new Array<{ seq: number, update: Update | null }>();
    onUpdates?: (updates: Update) => Promise<void>;

    constructor(client: BackendClient) {
        this.client = client;
        let s = storage.getNumber('updates-seq');
        if (s !== undefined) {
            this.#seq = s;
        }
        this.#sync = new InvalidateSync(this.#doSync);
    }

    start() {
        this.#sync.invalidate();
        setInterval(() => {
            this.#sync.invalidate();
        }, 10000);
        this.client.updates(this.#doReceive);
    }

    #doReceive = (seq: number, update: Update | null) => {
        log('UPD', 'Received update:' + seq);

        // Update max known seq
        if (seq > this.#maxKnownSeq) {
            this.#maxKnownSeq = Math.max(this.#maxKnownSeq, seq);
            this.#sync.invalidate();
        }

        // Push update to queue
        if (this.#seq === null || seq >= this.#seq && !!update) {
            this.#queue.push({ seq, update: update });
            this.#sync.invalidate();
        }
    }

    #doSync = async () => {

        // Do initial sync if needed
        if (this.#seq === null) {
            this.#seq = await this.client.getUpdatesSeq();
            this.#maxKnownSeq = Math.max(this.#seq, this.#maxKnownSeq);
            storage.set('updates-seq', this.#seq);
            log('UPD', 'Initial seq:' + this.#seq);
        }

        // Process queue
        if (this.#queue.length > 0) {

            // Sort
            this.#queue.sort((a, b) => a.seq - b.seq);

            // Remove outdated
            this.#queue = this.#queue.filter(item => item.seq > this.#seq!);

            // Apply updates
            while (this.#queue.length > 0 && this.#queue[0].seq === this.#seq + 1) {
                let update = this.#queue.shift()!;
                log('UPD', 'Applying update:' + update.seq + ', ' + JSON.stringify(update));
                if (this.onUpdates && update.update !== null) {
                    await this.onUpdates(update.update);
                }
                this.#seq++;
                storage.set('updates-seq', this.#seq);
            }
        }

        // Check if we are behind
        if (this.#seq < this.#maxKnownSeq) {
            log('UPD', 'Detected hole from ' + this.#seq + ' to ' + this.#maxKnownSeq);

            // Load diff
            let diff = await this.client.getUpdatesDiff(this.#seq);
            log('UPD', 'Diff:' + diff.seq + ', hasMore:' + diff.hasMore + ', updates:' + diff.updates.length);

            // Apply updates
            if (this.onUpdates) {
                for (let upd of diff.updates) {
                    let parsed = Updates.safeParse(upd);
                    if (parsed.success) {
                        log('UPD', 'Applying update:' + JSON.stringify(parsed.data));
                        await this.onUpdates(parsed.data);
                    } else {
                        log('UPD', 'Failed to parse update:' + JSON.stringify(upd));
                    }
                }
            }

            // Update seq
            if (this.#seq !== diff.seq) {
                this.#seq = diff.seq;
                this.#maxKnownSeq = Math.max(this.#seq, this.#maxKnownSeq);
                storage.set('updates-seq', this.#seq);
            }

            // Invalidate
            if (diff.hasMore) {
                this.#sync.invalidate();
            }
        }
    }
}