package com.superapp.audio

import android.util.Log

class OpusVedro {
    companion object {
        init {
            try {
                System.loadLibrary("opusvedro")
            } catch (e: Exception) {
                Log.e("AudioModule", "Couldn't load opus library: $e")
            }
        }
    }

    external fun decoderInit(sampleRate: Int, numChannels: Int): Int
    external fun decode(bytes: ByteArray, output: ByteArray): Int
    external fun decoderRelease()
}