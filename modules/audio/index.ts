import { AsyncLock } from 'teslabot';
import AudioModule from './src/AudioModule';

const lock = new AsyncLock();
export function compress(value: Uint8Array): Promise<{ format: string, data: Uint8Array }> {
  return lock.inLock(async () => {
    return { format: 'aac', data: await AudioModule.convert(value) };
  });
}

export function opusStart() {
  AudioModule.opusStart();
}

export function opusStop() {
  AudioModule.opusStop();
}

export function opusDecode(src: Uint8Array): Int16Array {
  return new Int16Array((AudioModule.opusDecode(src) as Uint8Array).buffer);
}