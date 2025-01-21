FROM ubuntu:22.04

# Set the working directory
WORKDIR /app

# Copy the AppImage file from the project root to the container
COPY ["Tari Universe (Alpha)_0.8.44_amd64.AppImage", "/app/"]

# Install required libraries
RUN apt-get update && apt-get install -y libfontconfig libharfbuzz0b libx11-6 libgbm-dev libfribidi0 libgl1 libegl1 dbus-x11 libgles2-mesa

# Make the AppImage executable
RUN chmod +x "/app/Tari Universe (Alpha)_0.8.44_amd64.AppImage"

# Run the AppImage
CMD ["/app/Tari Universe (Alpha)_0.8.44_amd64.AppImage", "--appimage-extract-and-run"]