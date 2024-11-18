# Build notes

# Cross-OS compile on Apple M(x) for Linux ARM64, using docker

```bash
git clone git@github.com:tari-project/universe.git
cd universe
mkdir -p src-tauri/target/temp/root
docker run -it --rm \
  -v /run/host-services/ssh-auth.sock:/run/host-services/ssh-auth.sock \
  -e SSH_AUTH_SOCK=/run/host-services/ssh-auth.sock \
  -v ${PWD}/src-tauri/target/temp/root:/root \
  -v ${PWD}:/work \
  -w /work \
  -p 0.0.0.0:2230-2240:1230-1240 \
  -u root \
  --platform linux/arm64 \
  ubuntu:20.04 bash
```

# Install some basic utils

```bash
apt-get update
apt-get install --no-install-recommends --assume-yes \
  apt-transport-https \
  ca-certificates \
  curl \
  wget \
  gpg
```

# Install compile tools

```bash
apt-get install --assume-yes build-essential
```

# Install tauri dependancies

```bash
apt-get install --no-install-recommends --assume-yes \
    libwebkit2gtk-4.0-dev \
    libappindicator3-dev \
    librsvg2-dev \
    patchelf \
    libprotobuf-dev \
    protobuf-compiler
```

# Needed for randomx-rs build

```bash
apt-get install --assume-yes \
    git \
    make \
    cmake \
    dh-autoreconf
```

# Needed for openssl library

```bash
apt-get install --assume-yes \
    openssl \
    libssl-dev \
    pkg-config
```

# Install rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
```

# Get rust to work in current shell

```bash
export PATH="$HOME/.cargo/bin:$PATH"
source "$HOME/.cargo/env"
```

# Check rust install

```bash
rustup target list --installed
rustup toolchain list
```

# Install nodejs from nodeSource

# more info can be found at https://github.com/nodesource/distributions

```bash
mkdir -p ~/temp/
curl -fsSL https://deb.nodesource.com/setup_22.x -o ~/temp/nodesource_setup.sh

bash ~/temp/nodesource_setup.sh
apt-get install --assume-yes nodejs

npm --version
```

# Install node modules

```bash
npm install
```

# Build node assets

```bash
npm run build
```

# Install tauri-cli

```bash
cargo install tauri-cli@latest
```

# Build application

```bash
cargo tauri build
```
