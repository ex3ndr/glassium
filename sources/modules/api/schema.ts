import * as z from 'zod';
import { contentCodec } from './content';

//
// Feed
//

const updateFeedPost = z.object({
    type: z.literal('feed-posted'),
    source: z.string(),
    by: z.string(),
    date: z.number(),
    repeatKey: z.string().nullable(),
    seq: z.number(),
    content: contentCodec
})

//
// Memory
//

const memoryContent = z.object({
    title: z.string(),
    summary: z.string(),
    image: z.string().nullable(),
    imageMetadata: z.object({
        thumbhash: z.string(),
        width: z.number(),
        height: z.number()
    }).nullable().optional()
});
export type MemoryContent = z.infer<typeof memoryContent>;

const memory = z.intersection(memoryContent, z.object({
    id: z.string(),
    index: z.number(),
    createdAt: z.number()
}));
export type Memory = z.infer<typeof memory>;

const udpateSessionCreated = z.object({
    type: z.literal('session-created'),
    id: z.string(),
    index: z.number(),
    created: z.number()
});
const udpateSessionClassified = z.object({
    type: z.literal('session-classified'),
    id: z.string(),
    class: z.string()
});
const updateSessionUpdated = z.object({
    type: z.literal('session-updated'),
    id: z.string(),
    state: z.union([z.literal('starting'), z.literal('in-progress'), z.literal('processing'), z.literal('finished'), z.literal('canceled')])
});
const updateSessionAudio = z.object({
    type: z.literal('session-audio-updated'),
    id: z.string(),
    audio: z.object({
        duration: z.number(),
        size: z.number(),
    })
});
const updateSessionTranscription = z.object({
    type: z.literal('session-transcribed'),
    id: z.string(),
    transcription: z.string()
});
const updateMemoryCreated = z.object({
    type: z.literal('memory-created'),
    id: z.string(),
    index: z.number(),
    memory: memoryContent
});
const updateMemoryUpdated = z.object({
    type: z.literal('memory-updated'),
    id: z.string(),
    index: z.number(),
    memory: memoryContent
});
export const Updates = z.union([udpateSessionCreated, updateSessionUpdated, updateSessionAudio, updateSessionTranscription, updateMemoryCreated, updateMemoryUpdated, udpateSessionClassified, updateFeedPost]);
export type UpdateSessionCreated = z.infer<typeof udpateSessionCreated>;
export type UpdateSessionUpdated = z.infer<typeof updateSessionUpdated>;
export type UpdateSessionAudio = z.infer<typeof updateSessionAudio>;
export type UpdateSessionTranscription = z.infer<typeof updateSessionTranscription>;
export type UpdateSessionClassified = z.infer<typeof udpateSessionClassified>;
export type UpdateMemoryCreated = z.infer<typeof updateMemoryCreated>;
export type UpdateMemoryUpdated = z.infer<typeof updateMemoryUpdated>;
export type UpdateFeedPosted = z.infer<typeof updateFeedPost>;
export type Update = UpdateSessionCreated | UpdateSessionUpdated | UpdateSessionAudio | UpdateSessionTranscription | UpdateMemoryCreated | UpdateMemoryUpdated | UpdateSessionClassified | UpdateFeedPosted;

const session = z.object({
    id: z.string(),
    index: z.number(),
    created: z.number(),
    audio: z.object({
        duration: z.number(),
        size: z.number(),
    }).nullable(),
    classification: z.string().nullable(),
    state: z.union([z.literal('starting'), z.literal('in-progress'), z.literal('processing'), z.literal('finished'), z.literal('canceled')])
});
export type Session = z.infer<typeof session>;

const fullSession = z.intersection(session, z.object({
    text: z.string().nullable()
}));
export type FullSession = z.infer<typeof fullSession>;

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
    getSession: z.object({
        ok: z.literal(true),
        session: fullSession
    }),
    getSeq: z.object({
        seq: z.number()
    }),
    getDiff: z.object({
        seq: z.number(),
        hasMore: z.boolean(),
        updates: z.array(z.any())
    }),
    deepgramToken: z.object({
        ok: z.literal(true),
        token: z.string()
    }),
    listMemories: z.object({
        ok: z.boolean(),
        memories: z.array(memory)
    }),
    accountStatus: z.object({
        ok: z.boolean()
    }),
    me: z.object({
        ok: z.literal(true),
        profile: z.object({
            id: z.string(),
            firstName: z.string(),
            lastName: z.string().nullable(),
            username: z.string(),
            phone: z.string().nullable(),
        })
    }),
    users: z.object({
        ok: z.literal(true),
        users: z.array(z.object({
            id: z.string(),
            firstName: z.string(),
            lastName: z.string().nullable(),
            username: z.string(),
            bot: z.boolean(),
            system: z.boolean(),
        }))
    }),
    feedState: z.object({
        ok: z.literal(true),
        seqno: z.number(),
    }),
    feedList: z.object({
        ok: z.literal(true),
        items: z.array(z.object({
            seq: z.number(),
            content: z.any(),
            date: z.number(),
            by: z.string(),
        })),
        next: z.number().nullable()
    })
};