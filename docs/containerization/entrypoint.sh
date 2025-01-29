
#!/bin/bash

export APPIMAGE_FILE=$(find /app/AppImage -name "*.AppImage" | head -n 1)
if [ -n "$APPIMAGE_FILE" ]; then
    echo "Found AppImage file: $APPIMAGE_FILE"
    if [ -x "$APPIMAGE_FILE" ]; then
        exec "$APPIMAGE_FILE" --appimage-extract-and-run
    else
        echo "AppImage file is not executable: $APPIMAGE_FILE"
        exit 1
    fi
else
    echo "No AppImage file found in /app directory."
    exit 1
fi
