#!/bin/bash

# Define the block of text to be added (multiline)
BLOCK=$(cat <<'EOF'
// Copyright 2025. The Tari Project
//
// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
// following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
// disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
// following disclaimer in the documentation and/or other materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote
// products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
// INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
// USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


EOF
)

# Define the directory containing the files
DIRECTORY="./src-tauri/src/"

# Function to process files in a directory recursively
process_directory() {
    local DIR="$1"

    # Loop through all files and directories in the current directory
    for ITEM in "$DIR"/*; do
        if [ -d "$ITEM" ]; then
            # If it's a directory, recurse into it
            process_directory "$ITEM"
        elif [ -f "$ITEM" ]; then
            # If it's a regular file, check and prepend the block
            if ! grep -Fxq "$BLOCK" "$ITEM"; then
                echo "Adding block to $ITEM"
                { printf "%s\n" "$BLOCK"; cat "$ITEM"; } > "$ITEM.tmp" && mv "$ITEM.tmp" "$ITEM"
            else
                echo "Block already exists in $ITEM, skipping."
            fi
        fi
    done
}

# Start processing the specified directory
process_directory "$DIRECTORY"

echo "Script completed."
