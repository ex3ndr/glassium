import ExpoModulesCore
import AVFoundation

public class AudioModule: Module {
  var opusDecoder: OpaquePointer? = nil
    
  public func definition() -> ModuleDefinition {
    Name("Audio")
      AsyncFunction("convert") { (source: Data, promise: Promise) in
          let fileManager = FileManager.default
          
          // Source and destinations
          let sourceURL = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("source.wav")
          let outputURL = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("output.m4a")
          if fileManager.fileExists(atPath: sourceURL.path) {
            do {
              try fileManager.removeItem(at: sourceURL)
            } catch {
              promise.reject(error)
              return
            }
          }
          if fileManager.fileExists(atPath: outputURL.path) {
            do {
              try fileManager.removeItem(at: outputURL)
            } catch {
              promise.reject(error)
              return
            }
          }
          
          // Init Converter
          try source.write(to: sourceURL)
          let audioAsset = AVAsset(url: sourceURL)
          let exportSession = AVAssetExportSession(asset: audioAsset, presetName: AVAssetExportPresetAppleM4A)!
          
          // Converter parameters
          exportSession.outputFileType = .m4a
          exportSession.outputURL = outputURL
          
          // Run
          exportSession.exportAsynchronously {
              if exportSession.status == .completed {
                do {
                  let outputData = try Data(contentsOf: outputURL)
                  promise.resolve(outputData)
                } catch {
                  promise.reject(error)
                }
              } else if exportSession.status == .failed {
                let error = exportSession.error ?? NSError(domain: "AudioModule", code: -1, userInfo: nil)
                promise.reject(error)
              }
          }
      }
      
      // Opus Codec
      Function("opusStart") {
          var error: Int32 = 0
          self.opusDecoder = opus_decoder_create(16000, 1, &error) // Always succeedes - no need to check for error
      }
      Function("opusDecode") { (frame: Data) -> Data in
          var pcm = Data(count: 5760 * 2)
          var output: Int = frame.withUnsafeBytes { (unsafeBytes: UnsafeRawBufferPointer) in
            let frameBytes = unsafeBytes.bindMemory(to: UInt8.self)
            return pcm.withUnsafeMutableBytes { (unsafePcm: UnsafeMutableRawBufferPointer) in
                var pcmRaw = unsafePcm.bindMemory(to: Int16.self)
                return Int(opus_decode(self.opusDecoder!, frameBytes.baseAddress, opus_int32(frameBytes.count), pcmRaw.baseAddress!, 5760, 0))
            }
          }
          return pcm.subdata(in: 0..<output*2)
      }
      Function("opusStop") {
          opus_decoder_destroy(self.opusDecoder)
          self.opusDecoder = nil
      }
  }
}
