#!/bin/bash
set -ex

# Parameters
OPUS_DIR="$1"
ARCH="$2"
MIN_IOS_VERSION="13.4"

# Prepare directories
cd $OPUS_DIR
OPUS_DIR=$(pwd)
rm -fr build-$ARCH
mkdir -p build-$ARCH

# Prepare parameters
OPT_CFLAGS="-Os -g"
OPT_LDFLAGS=""
OPT_CONFIG_ARGS=""
if [ "${ARCH}" == "x86_64" ]; then
  PLATFORM="iphonesimulator"
  EXTRA_CFLAGS="-arch ${ARCH}"
  EXTRA_CONFIG="--host=x86_64-apple-darwin"
elif [ "${ARCH}" == "sim_arm64" ]; then
  PLATFORM="iphonesimulator"
  EXTRA_CFLAGS="-arch arm64 --target=arm64-apple-ios$MIN_IOS_VERSION-simulator"
  EXTRA_CONFIG="--host=arm-apple-darwin20"
else
  PLATFORM="iphoneos"
  EXTRA_CFLAGS="-arch ${ARCH}"
  EXTRA_CONFIG="--host=arm-apple-darwin"
fi
SDK_PATH="$(xcrun --sdk $PLATFORM --show-sdk-path 2>/dev/null)"

# Build
./configure \
    --disable-shared \
    --enable-static \
    --with-pic \
    --disable-extra-programs \
    --disable-doc \
    --disable-asm \
    --enable-intrinsics \
    --enable-deep-plc \
    --enable-dred \
    --enable-osce ${EXTRA_CONFIG} \
    --prefix="${OPUS_DIR}/build-${ARCH}" \
    LDFLAGS="$LDFLAGS ${OPT_LDFLAGS} -fPIE -miphoneos-version-min=${MIN_IOS_VERSION} -L${OUTPUTDIR}/lib" \
    CFLAGS="$CFLAGS ${EXTRA_CFLAGS} ${OPT_CFLAGS} -fPIE -miphoneos-version-min=${MIN_IOS_VERSION} -I${OUTPUTDIR}/include -isysroot ${SDK_PATH}"
make -j
make install