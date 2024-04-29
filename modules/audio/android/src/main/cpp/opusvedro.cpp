//
// Created by Loboda Alexey on 21.05.2020.
//

#include <string>
#include <jni.h>
#include <opus.h>

OpusDecoder *decoder = nullptr;

extern "C" JNIEXPORT jint JNICALL
Java_com_superapp_audio_OpusVedro_decoderInit(JNIEnv *env, jobject thiz, jint sample_rate, jint num_channels)
{
    int size = opus_decoder_get_size(num_channels);
    decoder = (OpusDecoder *)malloc((size_t)size);
    int ret = opus_decoder_init(decoder, sample_rate, num_channels);
    return ret;
}

extern "C" JNIEXPORT jint JNICALL
Java_com_superapp_audio_OpusVedro_decode(JNIEnv *env, jobject thiz, jbyteArray bytes, jbyteArray output)
{
    jbyte *nativeBytes = env->GetByteArrayElements(bytes, 0);
    jbyte *nativeOutput = env->GetByteArrayElements(output, 0);
    jint length = env->GetArrayLength(bytes);
    jint outputLength = env->GetArrayLength(output) / 2;
    int res = opus_decode(decoder, (uint8_t *)nativeBytes, length, (opus_int16 *) nativeOutput, outputLength, 0);    
    env->ReleaseByteArrayElements(bytes, nativeBytes, 0);
    env->ReleaseByteArrayElements(output, nativeOutput, 0);
    return res;
}

extern "C" JNIEXPORT void JNICALL
Java_com_superapp_audio_OpusVedro_decoderRelease(JNIEnv *env, jobject thiz)
{
    if (decoder)
    {
        opus_decoder_destroy(decoder);
        decoder = nullptr;
    }
}