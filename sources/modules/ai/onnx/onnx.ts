import { Tensor, InferenceSession } from 'onnxruntime-react-native';
export { Tensor, InferenceSession };

export async function createSession(pathOrUrl: string) {
    return InferenceSession.create(pathOrUrl);
}