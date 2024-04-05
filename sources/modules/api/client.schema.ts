import * as z from 'zod';

export const Schema = {
    preState: z.object({
        phone: z.string(),
        needProfile: z.boolean(),
        needUsername: z.boolean(),
        active: z.boolean(),
        canActivate: z.boolean(),
    })
};