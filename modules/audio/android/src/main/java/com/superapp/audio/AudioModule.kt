package com.superapp.audio

import android.content.ComponentName
import android.content.Intent
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaDataSource
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import android.provider.SyncStateContract.Constants
import expo.modules.core.interfaces.Arguments
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File


class AudioModule : Module() {

    val opus = OpusVedro()
    var lastIntent: Intent? = null

    override fun definition() = ModuleDefinition {
        Name("Audio")
        AsyncFunction("convert") { value: ByteArray ->
            return@AsyncFunction compressAudioToAAC(value, appContext.cacheDirectory)
        }
        Function("opusStart") {
            opus.decoderInit(16000, 1)
        }
        Function("opusDecode") { value: ByteArray ->
            val output = ByteArray(5760)
            val res = opus.decode(value, output)
            output.copyOfRange(0, res * 2)
        }
        Function("opusStop") {
            opus.decoderRelease()
        }
        Function("foregroundStart") { options: AudioForegroundServiceOptions ->
            val intent = Intent(appContext.reactContext, AudioForegroundService::class.java)
            intent.putExtra("headlessTaskName", options.headlessTaskName)
            intent.putExtra("notificationTitle", options.notificationTitle)
            intent.putExtra("notificationDesc", options.notificationDesc)
            intent.putExtra("notificationColor", options.notificationColor)
            val notificationIconInt: Int = appContext.reactContext!!.resources.getIdentifier(options.notificationIconName, options.notificationIconType, appContext.reactContext!!.packageName)
            intent.putExtra("notificationIconInt", notificationIconInt)
            intent.putExtra("notificationProgress", options.notificationProgress)
            intent.putExtra("notificationMaxProgress", options.notificationMaxProgress)
            intent.putExtra("notificationIndeterminate", options.notificationIndeterminate)
            intent.putExtra("linkingURI", options.linkingURI)
            intent.putExtra("notificationId", 1)
            lastIntent = intent
            appContext.reactContext!!.startForegroundService(intent)
        }
        Function("foregroundStop") {
            if (lastIntent != null) {
                appContext.reactContext!!.stopService(lastIntent)
                lastIntent = null
            }
        }
    }
}

fun compressAudioToAAC(inputAudio: ByteArray, cacheDir: File): ByteArray {
    var outputFile: File? = null
    try {
        val mediaExtractor = MediaExtractor()
        mediaExtractor.setDataSource(ByteArrayMediaDataSource(inputAudio))

        val audioTrackIndex = selectAudioTrack(mediaExtractor)
        mediaExtractor.selectTrack(audioTrackIndex)

        val mediaFormat = mediaExtractor.getTrackFormat(audioTrackIndex)
        val outputFormat = MediaFormat.createAudioFormat(MediaFormat.MIMETYPE_AUDIO_AAC, mediaFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE), 1)
        outputFormat.setInteger(MediaFormat.KEY_BIT_RATE, 90000)
        outputFormat.setInteger(MediaFormat.KEY_AAC_PROFILE, MediaCodecInfo.CodecProfileLevel.AACObjectLC)
        outputFormat.setInteger(MediaFormat.KEY_MAX_INPUT_SIZE, 65536);

        val mediaCodec = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_AUDIO_AAC)
        mediaCodec.configure(outputFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
        mediaCodec.start()

        val buffersInfo = MediaCodec.BufferInfo()

        var outputDone = false
        var inputDone = false

        outputFile = File.createTempFile("audio-output-", ".m4a", cacheDir);
        val muxer = MediaMuxer(outputFile.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
        var audioTrackId = -1

        while (!outputDone) {
            if (!inputDone) {
                val inputBufferIndex = mediaCodec.dequeueInputBuffer(10000)
                if (inputBufferIndex >= 0) {
                    val buf = mediaCodec.getInputBuffer(inputBufferIndex)!!
                    val sampleSize = mediaExtractor.readSampleData(buf, 0)
                    if (sampleSize < 0) {
                        mediaCodec.queueInputBuffer(inputBufferIndex, 0, 0, 0L, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
                        inputDone = true
                    } else {
                        mediaCodec.queueInputBuffer(inputBufferIndex, 0, sampleSize, mediaExtractor.sampleTime, 0)
                        mediaExtractor.advance()
                    }
                }
            }

            when (val outputBufferIndex = mediaCodec.dequeueOutputBuffer(buffersInfo, 10000)) {
                MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                    val newFormat = mediaCodec.outputFormat
                    audioTrackId = muxer.addTrack(newFormat)
                    muxer.start()
                }

                MediaCodec.INFO_TRY_AGAIN_LATER -> {
                    // Ignore
                }

                else -> {
                    val outputBuffer = mediaCodec.getOutputBuffer(outputBufferIndex)!!
                    outputBuffer.position(buffersInfo.offset)
                    outputBuffer.limit(buffersInfo.offset + buffersInfo.size)
                    if (audioTrackId >= 0) {
                        muxer.writeSampleData(audioTrackId, outputBuffer, buffersInfo)
                    }

                    mediaCodec.releaseOutputBuffer(outputBufferIndex, false)
                    if (buffersInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) {
                        outputDone = true
                    }
                }
            }
        }
        muxer.stop()
        muxer.release()
        mediaCodec.stop()
        mediaCodec.release()
        mediaExtractor.release()

        return outputFile.readBytes()
    } finally {
        outputFile?.delete()
    }
}

private fun selectAudioTrack(mediaExtractor: MediaExtractor): Int {
    for (i in 0 until mediaExtractor.trackCount) {
        val mediaFormat = mediaExtractor.getTrackFormat(i)
        val mime = mediaFormat.getString(MediaFormat.KEY_MIME)
        if (mime?.startsWith("audio/") == true) {
            return i
        }
    }
    return -1
}

private class ByteArrayMediaDataSource(private val byteArray: ByteArray) : MediaDataSource() {

    override fun getSize(): Long {
        return byteArray.size.toLong()
    }

    override fun close() {
        // Do nothing
    }

    override fun readAt(position: Long, buffer: ByteArray?, offset: Int, size: Int): Int {
        if (buffer == null) {
            return -1
        }
        if (position >= byteArray.size) {
            return -1
        }
        val remainingBytes = byteArray.size - position.toInt()
        val bytesToRead = if (size < remainingBytes) size else remainingBytes
        System.arraycopy(byteArray, position.toInt(), buffer, offset, bytesToRead)
        return bytesToRead
    }
}