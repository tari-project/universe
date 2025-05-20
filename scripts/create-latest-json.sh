#!/usr/bin/env bash

# This script will be run in .github/workflows/release-exchange.yml
# Its job is too download all artifacts from the current workflow run
# Artifactts contains Tari app for each platform and signatures
# The script will then create a latest.json file with the following structure:
# {
#   "version": "1.0.10",
#   "notes": "Tari Universe - See the assets to download this version and install",
#   "pub_date": "2025-05-15T13:23:42.134Z",
#   "platforms": {
#     "linux-x86_64": {
#       "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbUtvKzlyYWhiOGQxK0lOb1NMNlFac2Z5bHV0bThBRWRyd09sc3BPa2YzelRUMXhJekprNFRXdkZVcXE3NE1TeHYxdjQydGZFZHY2SVY2UmlOWG5hcVJpSnUvRStScEF3PQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzQ3MzE0NTk5CWZpbGU6dGFyaV91bml2ZXJzZV8xLjAuMTBfYW1kNjQuQXBwSW1hZ2UKWWo0Z1lUMnUxUjZmZFF1Y3dZVjU4WHgxemV1dTN0aGxxN09lYWttdWFZWmdwbTRwcTAxUTVQMmNaM2p3c1hMUEtVY2tDMTI1a0FXRno2QXBGWFMzQ2c9PQo=",
#       "url": "https://github.com/tari-project/universe/releases/download/v1.0.10/tari_universe_1.0.10_amd64.AppImage"
#     },
#     "linux-aarch64": {
#       "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbUtvKzlyYWhiOFpsOXRlUVFFaFRMb2dzVnBoaTZJM3JpamJINnR2M1pUYnVwTDJ1NUt0SHVEUklZc2dROElPM3pGOGJnaTdTUTBodmJlWXJMdFVxNHkyOUowOERJcmdVPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzQ3MzE0NjI5CWZpbGU6dGFyaV91bml2ZXJzZV8xLjAuMTBfYWFyY2g2NC5BcHBJbWFnZQprbXdMUmsrU2tQUlVxbEt5ekZNSFZjcjZzVXZhUWs3MUpOVFhDVVpZVDJTd3J4WXhtZERWcm94Qm5tMWxBSGdWUUxvcjdvS05QTVRobU8zVGd6NGFDdz09Cg==",
#       "url": "https://github.com/tari-project/universe/releases/download/v1.0.10/tari_universe_1.0.10_aarch64.AppImage"
#     },
#     "darwin-aarch64": {
#       "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbUtvKzlyYWhiOGZRVElnNjdnOHh0YjM0NXZ2ZUMwRkVxazYxNzZRSW1rOHhQNFEvOC9VV1E4YVd3Yi90d3BLSDU0ZlVaWU9qcjVadlMwNEt4cVhsZnhNditnVUNlVVE4PQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzQ3MzE1MTc3CWZpbGU6VGFyaSBVbml2ZXJzZS5hcHAudGFyLmd6CkkyN0dSLy9FcExQMFhyY2hlTTJmbnFHb1FKWjJ0d0t3UmpMSVlaRi9URmtVdGd2VC9HR2V1WXgweEpMK2RDbE83Rllkekw0aHVvUi9wYSt5emdDdkNnPT0K",
#       "url": "https://github.com/tari-project/universe/releases/download/v1.0.10/Tari.Universe_universal.app.tar.gz"
#     },
#     "darwin-x86_64": {
#       "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbUtvKzlyYWhiOGZRVElnNjdnOHh0YjM0NXZ2ZUMwRkVxazYxNzZRSW1rOHhQNFEvOC9VV1E4YVd3Yi90d3BLSDU0ZlVaWU9qcjVadlMwNEt4cVhsZnhNditnVUNlVVE4PQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzQ3MzE1MTc3CWZpbGU6VGFyaSBVbml2ZXJzZS5hcHAudGFyLmd6CkkyN0dSLy9FcExQMFhyY2hlTTJmbnFHb1FKWjJ0d0t3UmpMSVlaRi9URmtVdGd2VC9HR2V1WXgweEpMK2RDbE83Rllkekw0aHVvUi9wYSt5emdDdkNnPT0K",
#       "url": "https://github.com/tari-project/universe/releases/download/v1.0.10/Tari.Universe_universal.app.tar.gz"
#     },
#     "windows-x86_64": {
#       "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbUtvKzlyYWhiOGRCK21WendUMkR0aWNVaElZcUFGZjhzMWJKZlZSbHhHblhpUUhQNmdSaFNZeEhGOUFiZVJMOU9Xem5CRDRweE1YdndyQmhVY1NDelRQQUlaOXUxU1F3PQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzQ3MzE1NDE3CWZpbGU6VGFyaSBVbml2ZXJzZV8xLjAuMTBfeDY0X2VuLVVTLm1zaQo2VEJvRmlhcHAxcDVSUDkxR3IxWGpuZERreGJHcXdjUkxsN0dkQW80VTRpMGRiT1ZQUnlPYWZqcHAxWExsQnZhZERlakFHQ2s3MzQ1ZkFKQjFhcFRDUT09Cg==",
#       "url": "https://github.com/tari-project/universe/releases/download/v1.0.10/Tari.Universe_1.0.10_x64_en-US.msi"
#     }
#   }
# }
# Where "1.0.10" is the version of the release, provided as parameter to the script
# The script will be run in the context of the release workflow, so it will have access to the GITHUB_TOKEN

# archives with the artifacts are downloaded to the current directory and will be accessed on these paths:

# ff0f0a96-52db-42d8-a84e-b781ad0c7614_1.0.10_macos-latest
# ff0f0a96-52db-42d8-a84e-b781ad0c7614_1.0.10_ubuntu-22.04-x64
# ff0f0a96-52db-42d8-a84e-b781ad0c7614_1.0.10_ubuntu-24.04-arm
# ff0f0a96-52db-42d8-a84e-b781ad0c7614_1.0.10_windows-latest
# ff0f0a96-52db-42d8-a84e-b781ad0c7614_1.0.10_x64_en-US

# The script will need to extract archives
# After extraction they will look like this:
# ff0f0a96-52db-42d8-a84e-b781ad0c7614_1.0.10_macos-latest:
# ├── dmg
# │   └── Tari.Universe_test-1.0.10_universal.dmg
# └── macos
#     ├── Tari Universe-test.app
#     └── Tari Universe-test.app.tar.gz
#     └── Tari Universe-test.app.tar.gz.sig

# ff0f0a96-52db-42d8-a84e-b781ad0c7614_1.0.10_ubuntu-22.04-x64:
# ├── appimage
# │   ├── tari_universe-test_1.0.10_amd64.AppImage
# │   └── tari_universe-test_1.0.10_amd64.AppImage.sig
# └── deb
#     ├── tari_universe-test_1.0.10_amd64.deb

# ff0f0a96-52db-42d8-a84e-b781ad0c7614_1.0.10_windows-latest
# ├── Tari Universe-test_1.0.10_x64_en-US.msi
# └── Tari Universe-test_1.0.10_x64_en-US.msi.sig

# For url we will use filesystem path

#!/usr/bin/env bash

set -euo pipefail

# Input: Version of the release
VERSION=$1
ID=$2
ARTIFACT_URLS=${3:-""}

# Initialize an empty array for URLs
URL_ARRAY=()

# Split URLs into an array if provided
if [[ -n "$ARTIFACT_URLS" ]]; then
  IFS=',' read -r -a URL_ARRAY <<< "$ARTIFACT_URLS"
fi


# Output JSON file
OUTPUT_FILE="latest.json"

# Base directory for extracted artifacts
BASE_DIR=$(pwd)

# Initialize the JSON structure
cat <<EOF > "$OUTPUT_FILE"
{
  "version": "$VERSION",
  "notes": "Tari Universe - See the assets to download this version and install",
  "pub_date": "$(date --utc +%Y-%m-%dT%H:%M:%SZ)",
  "platforms": {}
}
EOF

# Function to extract archives and update JSON
process_artifact() {
  local artifact_path=$1
  local platform_key=$2
  local artifact_url=$3

  # Extract the archive
  echo "Processing $artifact_path for $platform_key..."
  mkdir -p "$BASE_DIR/$platform_key"
  echo "Extracting $artifact_path..."
  unzip -o "$artifact_path" -d "$BASE_DIR/$platform_key" >/dev/null 2>&1  || tar -xvf "$artifact_path" -C "$BASE_DIR/$platform_key" >/dev/null 2>&1
  echo "Extracted to $BASE_DIR/$platform_key"

  # Find the main file and its signature
  echo "Finding main file and signature for $platform_key..."
  local main_file=$(find "$BASE_DIR/$platform_key" -type f -name "*.AppImage" -o -name "*.msi" -o -name "*.tar.gz" | head -n 1)
  echo "Main file found: $main_file"
  local signature_file=$(find "$BASE_DIR/$platform_key" -type f -name "*.sig" | head -n 1)

echo "Signature file found: $signature_file"
  if [[ -z "$main_file" || -z "$signature_file" ]]; then
    echo "Error: Could not find main file or signature for $platform_key"
    exit 1
  fi

  # Move main file to root directory
  echo "Moving main file to root directory..."
  mv "$main_file" "$BASE_DIR"
  echo "Main file moved to $BASE_DIR"
  main_file=$(basename "$main_file")

  # Read the signature
  echo "Reading signature..."
  local signature=$(cat "$signature_file" | base64 -w 0)

echo "Signature read: $signature"
  # Update the JSON
  if [[ -n "$artifact_url" ]]; then
    jq --arg platform "$platform_key" \
       --arg url "$artifact_url" \
       --arg signature "$signature" \
       '.platforms[$platform] = { "url": $url, "signature": $signature }' \
       "$OUTPUT_FILE" > tmp.json && mv tmp.json "$OUTPUT_FILE"
  else
    jq --arg platform "$platform_key" \
       --arg url "file://$main_file" \
       --arg signature "$signature" \
       '.platforms[$platform] = { "url": $url, "signature": $signature }' \
       "$OUTPUT_FILE" > tmp.json && mv tmp.json "$OUTPUT_FILE"
  fi
}

# Process each artifact with its corresponding URL (if provided)
process_artifact "${ID}_${VERSION}_ubuntu-22.04-x64.zip" "ubuntu-22.04" "${URL_ARRAY[0]:-}"
process_artifact "${ID}_${VERSION}_ubuntu-24.04-arm.zip" "ubuntu-24.04-arm" "${URL_ARRAY[1]:-}"
process_artifact "${ID}_${VERSION}_macos-latest.zip" "macos-latest" "${URL_ARRAY[2]:-}"
process_artifact "${ID}_${VERSION}_windows-latest.zip" "windows-latest" "${URL_ARRAY[3]:-}"

# get file from $BASE_DIR/macos-latest/dmg add its name to variable and move to root
macos_dmg_file=$(find "$BASE_DIR/macos-latest/dmg" -type f -name "*.dmg" | head -n 1)
if [[ -z "$macos_dmg_file" ]]; then
  echo "Error: Could not find macOS dmg file"
  exit 1
fi
mv "$macos_dmg_file" "$BASE_DIR"


echo "Generated $OUTPUT_FILE:"
cat "$OUTPUT_FILE"