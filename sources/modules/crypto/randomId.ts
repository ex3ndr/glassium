import * as Crypto from 'expo-crypto';

export function randomId(length = 16) {
    let data = Crypto.getRandomBytes(length);
    return data.reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
}