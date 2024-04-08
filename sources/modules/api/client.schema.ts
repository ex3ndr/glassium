import * as z from 'zod';

const udpateSessionCreated = z.object({
    type: z.literal('session-created'),
    id: z.string(),
    index: z.number(),
    created: z.number()
});
const updateSessionUpdated = z.object({
    type: z.literal('session-updated'),
    id: z.string(),
    state: z.union([z.literal('starting'), z.literal('in-progress'), z.literal('processing'), z.literal('finished'), z.literal('canceled')])
});
export const Updates = z.union([udpateSessionCreated, updateSessionUpdated]);
export type UpdateSessionCreated = z.infer<typeof udpateSessionCreated>;
export type UpdateSessionUpdated = z.infer<typeof updateSessionUpdated>;
export type Update = UpdateSessionCreated | UpdateSessionUpdated;

const session = z.object({
    id: z.string(),
    index: z.number(),
    created: z.number(),
    state: z.union([z.literal('starting'), z.literal('in-progress'), z.literal('processing'), z.literal('finished'), z.literal('canceled')])
});
export type Session = z.infer<typeof session>;

export const sseUpdate = z.object({
    seq: z.number(),
    data: z.any()
});

export const Schema = {
    preState: z.object({
        phone: z.string(),
        needName: z.boolean(),
        needUsername: z.boolean(),
        active: z.boolean(),
        canActivate: z.boolean(),
    }),
    preUsername: z.union([z.object({
        ok: z.literal(true),
    }), z.object({
        ok: z.literal(false),
        error: z.union([z.literal('invalid_username'), z.literal('already_used')]),
    })]),
    preName: z.union([z.object({
        ok: z.literal(true),
    }), z.object({
        ok: z.literal(false),
        error: z.literal('invalid_name'),
    })]),
    sessionStart: z.object({
        ok: z.literal(true),
        session: session
    }),
    uploadAudio: z.object({
        ok: z.boolean(),
    }),
    listSessions: z.object({
        ok: z.boolean(),
        sessions: z.array(session),
        next: z.string().nullable()
    }),
    getSeq: z.object({
        seq: z.number()
    }),
    getDiff: z.object({
        seq: z.number(),
        hasMore: z.boolean(),
        updates: z.array(z.any())
    })
};