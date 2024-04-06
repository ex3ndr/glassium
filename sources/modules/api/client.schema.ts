import * as z from 'zod';

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
        session: z.string(),
    }),
};