#!/bin/bash
set -ex

# Parameters
OPUS_VERSION="1.5.2"

# Cleanup
rm -fr opus-${OPUS_VERSION} opus-${OPUS_VERSION}.tar.gz opus.xcframework

# Download Opus
wget https://downloads.xiph.org/releases/opus/opus-${OPUS_VERSION}.tar.gz
tar zxf opus-${OPUS_VERSION}.tar.gz
rm opus-${OPUS_VERSION}.tar.gz

# Build Opus
./build_ios.sh opus-${OPUS_VERSION} arm64
./build_ios.sh opus-${OPUS_VERSION} sim_arm64

# Create universal binary
xcodebuild -create-xcframework \
    -library opus-${OPUS_VERSION}/build-arm64/lib/libopus.a -headers opus-${OPUS_VERSION}/build-arm64/include \
    -library opus-${OPUS_VERSION}/build-sim_arm64/lib/libopus.a -headers opus-${OPUS_VERSION}/build-sim_arm64/include \
    -output opus.xcframework