FROM ubuntu:22.04

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libfontconfig \
    libharfbuzz-bin \
    libx11-6 \
    libgbm-dev \
    libfribidi0 \
    libgl1 \
    libegl1 \
    dbus-x11 \
    libgles2-mesa \
    libwebkit2gtk-4.1-0 \
    at-spi2-core

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]