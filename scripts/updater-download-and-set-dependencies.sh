#!/usr/bin/env bash

# This script was created to avoid calling it inline in the workflow file. Which would show the EXCHANGE_ID and EXCHANGE_NAME in the logs.

# Set environment variables
EXCHANGE_ID="${EXCHANGE_ID}"
EXCHANGE_NAME="${EXCHANGE_NAME}"
APP_VERSION="${APP_VERSION}"
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}"
AWS_ENDPOINT_URL="${AWS_ENDPOINT_URL}"
AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION}"
BASE_PATH="${BASE_PATH}"

echo "Environment variables set:"
echo "EXCHANGE_ID: ${EXCHANGE_ID}"
echo "EXCHANGE_NAME: ${EXCHANGE_NAME}"
echo "APP_VERSION: ${APP_VERSION}"
echo "BASE_PATH: ${BASE_PATH}"

# Step 1: Download artifacts from CDN
echo "Creating directories for artifacts"
mkdir -p ./${EXCHANGE_ID}_${APP_VERSION}_macos-latest
mkdir -p ./${EXCHANGE_ID}_${APP_VERSION}_windows-latest
mkdir -p ./${EXCHANGE_ID}_${APP_VERSION}_ubuntu-22.04-x64
mkdir -p ./${EXCHANGE_ID}_${APP_VERSION}_ubuntu-24.04-arm

echo "Downloading artifacts from CDN"

# curl -s --location --remote-name --output-dir "./${EXCHANGE_ID}_${APP_VERSION}_ubuntu-22.04-x64" "${BASE_PATH}/tari_universe-${EXCHANGE_NAME}_${APP_VERSION}_amd64.AppImage"
# echo "Downloaded ubuntu-22.04-x64 appimage"
# curl -s --location --remote-name --output-dir "./${EXCHANGE_ID}_${APP_VERSION}_ubuntu-22.04-x64" "${BASE_PATH}/tari_universe-${EXCHANGE_NAME}_${APP_VERSION}_amd64.AppImage.sig"
# echo "Downloaded ubuntu-22.04-x64 appimage.sig"

# curl -s --location --remote-name --output-dir "./${EXCHANGE_ID}_${APP_VERSION}_ubuntu-24.04-arm" "${BASE_PATH}/tari_universe-${EXCHANGE_NAME}_${APP_VERSION}_aarch64.AppImage"
# echo "Downloaded ubuntu-24.04-arm appimage"
# curl -s --location --remote-name --output-dir "./${EXCHANGE_ID}_${APP_VERSION}_ubuntu-24.04-arm" "${BASE_PATH}/tari_universe-${EXCHANGE_NAME}_${APP_VERSION}_aarch64.AppImage.sig"
# echo "Downloaded ubuntu-24.04-arm appimage.sig"

curl -s --location --output-dir "./${EXCHANGE_ID}_${APP_VERSION}_macos-latest" "${BASE_PATH}/Tari%20Universe-${EXCHANGE_NAME}.app.tar.gz.sig" --output "Tari Universe-${EXCHANGE_NAME}.app.tar.gz.sig"
echo "Downloaded macos_latest app.tar.gz.sig"
curl -s --location --output-dir "./${EXCHANGE_ID}_${APP_VERSION}_macos-latest" "${BASE_PATH}/Tari%20Universe-${EXCHANGE_NAME}.app.tar.gz" --output "Tari Universe-${EXCHANGE_NAME}.app.tar.gz"
echo "Downloaded macos_latest app.tar.gz"

# curl -s --location --remote-name --output-dir "./${EXCHANGE_ID}_${APP_VERSION}_windows-latest" "${BASE_PATH}/Tari%20Universe-${EXCHANGE_NAME}_${APP_VERSION}_x64_en-US.msi" --output "Tari Universe-${EXCHANGE_NAME}_${APP_VERSION}_x64_en-US.msi"
# echo "Downloaded windows-latest msi"
# curl -s --location --remote-name --output-dir "./${EXCHANGE_ID}_${APP_VERSION}_windows-latest" "${BASE_PATH}/Tari%20Universe-${EXCHANGE_NAME}_${APP_VERSION}_x64_en-US.msi.sig" --output "Tari Universe-${EXCHANGE_NAME}_${APP_VERSION}_x64_en-US.msi.sig"
# echo "Downloaded windows-latest msi.sig"

# Step 2: Construct binaries download URLs

export MSI_URL="${BASE_PATH}/Tari Universe-${EXCHANGE_NAME}_${APP_VERSION}_x64_en-US.msi"
export AARCH64_URL="${BASE_PATH}/tari_universe-${EXCHANGE_NAME}_${APP_VERSION}_aarch64.AppImage"
export AMD64_URL="${BASE_PATH}/tari_universe-${EXCHANGE_NAME}_${APP_VERSION}_amd64.AppImage"
export TAR_URL="${BASE_PATH}/Tari Universe-${EXCHANGE_NAME}.app.tar.gz"

echo "::set-output MSI_URL=${MSI_URL}"
echo "::set-output AMD64_URL=${AMD64_URL}"
echo "::set-output AARCH64_URL=${AARCH64_URL}"
echo "::set-output TAR_URL=${TAR_URL}"

echo "Binaries download URLs constructed and exported."