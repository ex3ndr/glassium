import { Tensor, InferenceSession } from 'onnxruntime-web';
export { Tensor, InferenceSession };

export async function createSession(pathOrUrl: string) {
    return InferenceSession.create(pathOrUrl, { executionProviders: ['webgl', 'webgpu'] });
}