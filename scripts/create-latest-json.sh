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
OUTPUT_FILE="latest-${ID}.json"

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

check_if_file_exists_and_move() {
  local file_path=$1
  local find_by=$2

  # Check if the file exists
if [[ ! -d "$file_path" ]]; then
  echo "Error: Directory $file_path not found"
  # Continue without exiting
else
  # Proceed to find the macOS DMG file
  file=$(find "$file_path" -type f -name "$find_by" | head -n 1)
  if [[ -z "$file" ]]; then
    echo "Error: Could not find file in $file_path"
    # Continue without exiting
  else
    echo "file found: $file"
    mv "$file" "$BASE_DIR"
  fi
fi
}

prepare_directory_files() {
  local artifact_path=$1
  local platform_key=$2

  # Check if the directory already exists
  if [[ -d "$BASE_DIR/$platform_key" ]]; then
    echo "Directory $BASE_DIR/$platform_key already exists. Removing it..."
    rm -rf "$BASE_DIR/$platform_key"
  fi

  # Check if the artifact file exists
  if [[ ! -d "$artifact_path" ]]; then
    echo "Error: Artifact file $artifact_path does not exist."
    if [[ ! -f "${artifact_path}.zip" ]]; then
      echo "Error: Artifact file $artifact_path.zip does not exist."
      return 1
    else
      artifact_path="$artifact_path.zip"
    fi
  fi

  # Check if the artifact is already unzipped
  if [[ -d "$artifact_path" ]]; then
    echo "Artifact $artifact_path is already unzipped. Copying files..."
    mkdir -p "$BASE_DIR/$platform_key"
    cp -r "$artifact_path"/* "$BASE_DIR/$platform_key"
  else
    # Extract the archive
    echo "Processing $artifact_path for $platform_key..."
    mkdir -p "$BASE_DIR/$platform_key"
    echo "Extracting $artifact_path..."
    unzip -o "$artifact_path" -d "$BASE_DIR/$platform_key" >/dev/null 2>&1 || tar -xvf "$artifact_path" -C "$BASE_DIR/$platform_key" >/dev/null 2>&1
    echo "Extracted to $BASE_DIR/$platform_key"
  fi
}

# Function to extract archives and update JSON
process_artifact() {
  local artifact_path=$1
  local platform_key=$2
  local artifact_url=$3

  # Prepare the directory and extract files
  prepare_directory_files "$artifact_path" "$platform_key"
  # Check if the directory was created successfully
  if [[ ! -d "$BASE_DIR/$platform_key" ]]; then
    echo "Error: Failed to create directory $BASE_DIR/$platform_key"
    return 1
  fi

  # Find the main file and its signature
  echo "Finding main file and signature for $platform_key..."
  local main_file=$(find "$BASE_DIR/$platform_key" -type f -name "*.AppImage" -o -name "*.msi" -o -name "*.tar.gz" | head -n 1)
  echo "Main file found: $main_file"
  local signature_file=$(find "$BASE_DIR/$platform_key" -type f -name "*.sig" | head -n 1)

echo "Signature file found: $signature_file"
  if [[ -z "$main_file" || -z "$signature_file" ]]; then
    echo "Error: Could not find main file or signature for $platform_key"
    return 1
  fi

  # Move main file to root directory
  echo "Moving main file to root directory..."
  mv "$main_file" "$BASE_DIR"
  echo "Main file moved to $BASE_DIR"
  main_file=$(basename "$main_file")

  # Read the signature
  echo "Reading signature..."
  local signature=$(cat "$signature_file")

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
process_artifact "${BASE_DIR}/${ID}_${VERSION}_ubuntu-22.04-x64" "linux-x86_64" "${URL_ARRAY[0]:-}" || true
process_artifact "${BASE_DIR}/${ID}_${VERSION}_ubuntu-24.04-arm" "linux-aarch64" "${URL_ARRAY[1]:-}" || true
process_artifact "${BASE_DIR}/${ID}_${VERSION}_macos-latest" "darwin-aarch64" "${URL_ARRAY[2]:-}" || true
process_artifact "${BASE_DIR}/${ID}_${VERSION}_macos-latest" "darwin-x86_64" "${URL_ARRAY[2]:-}" || true
process_artifact "${BASE_DIR}/${ID}_${VERSION}_windows-latest" "windows-x86_64" "${URL_ARRAY[3]:-}" || true
prepare_directory_files "${BASE_DIR}/${ID}_${VERSION}_x64_en-US" "windows-exe" || true
prepare_directory_files "${BASE_DIR}/${ID}_${VERSION}_ubuntu-22.04-x64-rpm" "ubuntu-x64-rpm" || true
prepare_directory_files "${BASE_DIR}/${ID}_${VERSION}_ubuntu-24.04-arm-rpm" "ubuntu-arm-rpm" || true

#1eff0ada-8358-4511-99f8-9ec2820aa37e_1.0.10_ubuntu-22.04-x64-rpm
#1eff0ada-8358-4511-99f8-9ec2820aa37e_1.0.10_ubuntu-24.04-arm-rpm

check_if_file_exists_and_move "$BASE_DIR/darwin-aarch64/dmg" "*.dmg"
check_if_file_exists_and_move "$BASE_DIR/windows-exe" "*en-US.exe"
check_if_file_exists_and_move "$BASE_DIR/ubuntu-x64-rpm" "*.rpm"
check_if_file_exists_and_move "$BASE_DIR/ubuntu-arm-rpm" "*.rpm"
check_if_file_exists_and_move "$BASE_DIR/linux-x86_64/deb" "*.deb"
check_if_file_exists_and_move "$BASE_DIR/linux-aarch64/deb" "*.deb"

# # get file from $BASE_DIR/macos-latest/dmg add its name to variable and move to root
# # Check if the directory exists
# if [[ ! -d "$BASE_DIR/macos-latest/dmg" ]]; then
#   echo "Error: Directory $BASE_DIR/macos-latest/dmg not found"
#   # Continue without exiting
# else
#   # Proceed to find the macOS DMG file
#   macos_dmg_file=$(find "$BASE_DIR/macos-latest/dmg" -type f -name "*.dmg" | head -n 1)
#   if [[ -z "$macos_dmg_file" ]]; then
#     echo "Error: Could not find macOS DMG file in $BASE_DIR/macos-latest/dmg"
#     # Continue without exiting
#   else
#     echo "macOS DMG file found: $macos_dmg_file"
#     mv "$macos_dmg_file" "$BASE_DIR"
#   fi
# fi

# if [[ ! -d "$BASE_DIR/windows-exe" ]]; then
#   echo "Error: Directory $BASE_DIR/windows-exe not found"
#   # Continue without exiting
# else
#   # Proceed to find the Windows exe file
#   windows_exe_file=$(find "$BASE_DIR/windows-exe" -type f -name "*en-US.exe" | head -n 1)
#   if [[ -z "$windows_exe_file" ]]; then
#     echo "Error: Could not find Windows exe file in $BASE_DIR/windows-exe"
#     # Continue without exiting
#   else
#     echo "Windows exe file found: $windows_exe_file"
#     mv "$windows_exe_file" "$BASE_DIR"
#   fi
# fi


echo "Generated $OUTPUT_FILE:"
cat "$OUTPUT_FILE"