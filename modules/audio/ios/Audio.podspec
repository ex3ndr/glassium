Pod::Spec.new do |s|
  s.name           = 'Audio'
  s.version        = '1.0.0'
  s.summary        = 'A sample project summary'
  s.description    = 'A sample project description'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '13.4', :tvos => '13.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
  }
  s.vendored_frameworks = "opus.xcframework"
  s.public_header_files = 'Audio-Bridging-Header.h'
  s.source_files = [
    "AudioModule.swift",
    "Audio-Bridging-Header.h"
  ]
end
