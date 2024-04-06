import ExpoModulesCore
import AVFoundation

public class AudioModule: Module {
  public func definition() -> ModuleDefinition {
    Name("Audio")
      AsyncFunction("convert") { (source: Data, promise: Promise) in
          let sourceURL = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("source.aac")
          try source.write(to: sourceURL)
          let outputURL = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("output.aac")
          let audioAsset = AVAsset(url: sourceURL)
          let exportSession = AVAssetExportSession(asset: audioAsset, presetName: AVAssetExportPresetMediumQuality)!
          exportSession.outputFileType = .m4a
          exportSession.outputURL = outputURL
          
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
  }
}
