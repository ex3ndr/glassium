import { MMKV } from 'react-native-mmkv';
import * as z from 'zod';

export const storage = new MMKV();

export function storageGetTyped<T>(key: string, schema: z.Schema<T>): T | null {
    let value = storage.getString(key);
    if (!value) {
        return null;
    }
    try {
        return schema.parse(JSON.parse(value));
    } catch (e) {
        console.error(e);
        return null;
    }
}

export function storageSetTyped<T>(key: string, schema: z.Schema<T>, value: T) {
    storage.set(key, JSON.stringify(value));
}