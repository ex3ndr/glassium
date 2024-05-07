import * as z from 'zod';

//
// Content
//

type UnknownContent = {
    kind: 'unknown'
};

type ContentBase = {
    kind: 'transcription',
    transcription: { sender: string, text: string }[] | string
} | {
    kind: 'text',
    text: string;
} | UnknownContent;

export type Content = ContentBase | Content[];

//
// Codec
//

function fallback<T>(value: T) {
    return z.any().transform(() => value);
}

const baseContentCodec: z.ZodType<ContentBase> = z.union([
    z.object({
        kind: z.literal('text'),
        text: z.string()
    }),
    z.object({
        kind: z.literal('transcription'),
        transcription: z.union([z.string(), z.array(z.object({
            sender: z.string(),
            text: z.string()
        }))])
    }),
    fallback<UnknownContent>({ kind: 'unknown' })
]);

export const contentCodec: z.ZodType<Content> = z.union([baseContentCodec, z.array(baseContentCodec)]);