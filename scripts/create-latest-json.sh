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

#!/usr/bin/env bash

set -euo pipefail

# Ensure the version is passed as an argument
if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <version>"
  exit 1
fi

VERSION="$1"
NOTES="Tari Universe - See the assets to download this version and install"
PUB_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LATEST_JSON="latest.json"

# Ensure GITHUB_TOKEN is available
if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "Error: GITHUB_TOKEN is not set."
  exit 1
fi

# Function to download artifacts for a specific platform
download_artifact() {
  local platform="$1"
  local artifact_name="$2"
  local output_file="$3"

  echo "Downloading artifact for platform: $platform"
  gh run download --name "$artifact_name" --pattern "$output_file" --token "$GITHUB_TOKEN"
}

# Function to generate platform entry
generate_platform_entry() {
  local platform="$1"
  local artifact_name="$2"
  local signature_file="$3"
  local url="$4"

  # Download artifact and signature
  download_artifact "$platform" "$artifact_name" "$artifact_name"
  download_artifact "$platform" "$signature_file" "$signature_file"

  # Read signature content
  local signature
  signature=$(cat "$signature_file")

  # Generate JSON entry
  echo "\"$platform\": {"
  echo "  \"signature\": \"$signature\","
  echo "  \"url\": \"$url\""
  echo "}"
}

# Start building the latest.json structure
echo "{" > "$LATEST_JSON"
echo "  \"version\": \"$VERSION\"," >> "$LATEST_JSON"
echo "  \"notes\": \"$NOTES\"," >> "$LATEST_JSON"
echo "  \"pub_date\": \"$PUB_DATE\"," >> "$LATEST_JSON"
echo "  \"platforms\": {" >> "$LATEST_JSON"

# Define platforms and their respective artifact names
PLATFORMS=(
  "linux-x86_64 tari_universe_${VERSION}_amd64.AppImage tari_universe_${VERSION}_amd64.AppImage.sig https://github.com/tari-project/universe/releases/download/v${VERSION}/tari_universe_${VERSION}_amd64.AppImage"
  "linux-aarch64 tari_universe_${VERSION}_aarch64.AppImage tari_universe_${VERSION}_aarch64.AppImage.sig https://github.com/tari-project/universe/releases/download/v${VERSION}/tari_universe_${VERSION}_aarch64.AppImage"
  "darwin-aarch64 Tari.Universe_universal.app.tar.gz Tari.Universe_universal.app.tar.gz.sig https://github.com/tari-project/universe/releases/download/v${VERSION}/Tari.Universe_universal.app.tar.gz"
  "darwin-x86_64 Tari.Universe_universal.app.tar.gz Tari.Universe_universal.app.tar.gz.sig https://github.com/tari-project/universe/releases/download/v${VERSION}/Tari.Universe_universal.app.tar.gz"
  "windows-x86_64 Tari.Universe_${VERSION}_x64_en-US.msi Tari.Universe_${VERSION}_x64_en-US.msi.sig https://github.com/tari-project/universe/releases/download/v${VERSION}/Tari.Universe_${VERSION}_x64_en-US.msi"
)

# Loop through platforms and generate entries
for i in "${!PLATFORMS[@]}"; do
  IFS=" " read -r platform artifact_name signature_file url <<< "${PLATFORMS[$i]}"
  generate_platform_entry "$platform" "$artifact_name" "$signature_file" "$url" >> "$LATEST_JSON"

  # Add a comma if it's not the last platform
  if [ "$i" -lt $((${#PLATFORMS[@]} - 1)) ]; then
    echo "," >> "$LATEST_JSON"
  fi
done

# Close the JSON structure
echo "  }" >> "$LATEST_JSON"
echo "}" >> "$LATEST_JSON"

echo "latest.json has been created successfully."