import AudioModule from './src/AudioModule';

export async function compress(value: Uint8Array): Promise<{ format: string, data: Uint8Array }> {
  return await AudioModule.convert(value);
}