
# Basic build environment setup guide for Windows using winget for quick developer package testing - neither definitive nor exhaustive

Lots of info collected from - https://github.com/KhronosGroup/OpenCL-Guide/blob/main/chapters/getting_started_windows.md

and ```for needed for developing Tauri apps.``` - https://v1.tauri.app/v1/guides/getting-started/prerequisites

Need to have ```winget``` installed and working, which requires ```App Installer```, not only installed, but updated to the latest version.

Using Microsoft Edge, open the following URL:

https://www.microsoft.com/p/app-installer/9nblggh4nns1#activetab=pivot:overviewtab

then click the ```App Installer``` install button.

Found that after installing and rebooting Windows and checking for ```App Installer``` updates and appling any outstanding updates. 

Check that ```winget``` is working, run in PowerShell.
```PowerShell
winget list
```
sample of output without ```App Installer``` installed
```
PS C:\Users\leet> winget list
  |
PS C:\Users\leet>
```

sample output where ```winget``` has not be run yet:
```PowerShell
PS C:\Users\leet> winget list
Failed in attempting to update the source: winget
The `msstore` source requires that you view the following agreements before using.
Terms of Transaction: https://aka.ms/microsoft-store-terms-of-transaction
The source requires the current machine's 2-letter geographic region to be sent to the backend service to function properly (ex. "US").

Do you agree to all the source agreements terms?
[Y] Yes  [N] No: y
Failed when searching source; results will not be included: winget
Name                                           Id                                                   Version
-----------------------------------------------------------------------------------------------------------------------
Clipchamp                                      Clipchamp.Clipchamp_yxz26nhyzhsrt                    2.2.8.0
Microsoft Edge                                 Microsoft Edge                                       130.0.2849.80
Microsoft Edge WebView2 Runtime                Microsoft EdgeWebView                                130.0.2849.80
```
please notice ```Failed when searching source; results will not be included: winget```, normally means that ```App Installer``` needs to be updated.

sample output where ```App Installer``` is installed, but not updated to the latest:
```
PS C:\Users\leet> winget list
Failed in attempting to update the source: winget
Failed when searching source; results will not be included: winget
```

sample of output where ```winget``` is ready to be used for installing tools:
```
PS C:\Users\leet> winget list
Name                                    Id                                       Version          Available      Source
-----------------------------------------------------------------------------------------------------------------------
Microsoft Visual Studio Installer       ARP\Machine\X64\{6F320B93-EE3C-4826-85E… 3.11.2180.21897
Tari Universe (Beta)                    ARP\Machine\X64\{A2500DE1-1C20-4E7E-9C5… 0.5.60.41105
Visual Studio Build Tools 2022          Microsoft.VisualStudio.2022.BuildTools   17.11.5                         winget
Microsoft Edge                          Microsoft.Edge                           130.0.2849.68                   winget
Microsoft Edge Update                   ARP\Machine\X86\Microsoft Edge Update    1.3.195.31
Microsoft Edge WebView2 Runtime         Microsoft.EdgeWebView2Runtime            130.0.2849.56                   winget
Microsoft Visual C++ 2015-2022 Redistr… Microsoft.VCRedist.2015+.x64             14.40.33810.0    14.40.33816.0  winget
Microsoft OneDrive                      Microsoft.OneDrive                       24.201.1006.0005                winget
Clipchamp                               MSIX\Clipchamp.Clipchamp_2.2.8.0_neutra… 2.2.8.0
```

Then we can start installing components that will be needed in Compiling ```Tari Universe Alpha``` locally

# Install Visual Studio BuildTools 2022
```PowerShell
winget install "Visual Studio BuildTools 2022"
```
sample output would look something like:
```
PS C:\Users\leet> winget install "Visual Studio BuildTools 2022"
Found Visual Studio BuildTools 2022 [Microsoft.VisualStudio.2022.BuildTools] Version 17.11.5
This application is licensed to you by its owner.
Microsoft is not responsible for, nor does it grant any licenses to, third-party packages.
Downloading https://download.visualstudio.microsoft.com/download/pr/69e24482-3b48-44d3-af65-51f866a08313/471c9a89fa8ba27d356748ae0cf25eb1f362184992dc0bb6e9ccf10178c43c27/vs_BuildTools.exe
  ██████████████████████████████  4.22 MB / 4.22 MB
Successfully verified installer hash
Starting package install...
Successfully installed
```

# Install Visual Studio components for Windows 11
```PowerShell
& "C:\Program Files (x86)\Microsoft Visual Studio\Installer\setup.exe" install --passive --norestart --productId Microsoft.VisualStudio.Product.BuildTools --channelId VisualStudio.17.Release --add Microsoft.VisualStudio.Component.VC.Tools.x86.x64 --add Microsoft.VisualStudio.Component.VC.Redist.14.Latest --add Microsoft.VisualStudio.Component.Windows11SDK.26100 --add Microsoft.VisualStudio.Component.VC.CMake.Project --add Microsoft.VisualStudio.Component.VC.CoreBuildTools --add Microsoft.VisualStudio.Component.VC.CoreIde --add Microsoft.VisualStudio.Component.VC.Redist.14.Latest --add Microsoft.VisualStudio.ComponentGroup.NativeDesktop.Core
````
sample of the begining of output:
```
PS C:\Users\leet> & "C:\Program Files (x86)\Microsoft Visual Studio\Installer\setup.exe" install --passive --norestart --productId Microsoft.VisualStudio.Product.BuildTools --channelId VisualStudio.17.Release --add Microsoft.VisualStudio.Component.VC.Tools.x86.x64 --add Microsoft.VisualStudio.Component.VC.Redist.14.Latest --add Microsoft.VisualStudio.Component.Windows11SDK.22000
PS C:\Users\leet> [1d44:0001][2024-11-05T02:37:56] Saving the current locale (en-US) to user.json.
[1d44:0001][2024-11-05T02:37:56] Setting the telemetry services
[1d44:0005][2024-11-05T02:37:56] Creating a new telemetry service.
[1d44:0001][2024-11-05T02:37:56] Visual Studio Installer Version: 3.11.2180
[1d44:0001][2024-11-05T02:37:56] Raw Command line: "C:\Program Files (x86)\Microsoft Visual Studio\Installer\setup.exe" install --passive --norestart --productId Microsoft.VisualStudio.Product.BuildTools --channelId VisualStudio.17.Release --add Microsoft.VisualStudio.Component.VC.Tools.x86.x64 --add Microsoft.VisualStudio.Component.VC.Redist.14.Latest --add Microsoft.VisualStudio.Component.Windows11SDK.22000
[1d44:0001][2024-11-05T02:37:56] Parsed command line options: install --add Microsoft.VisualStudio.Component.VC.Tools.x86.x64 Microsoft.VisualStudio.Component.VC.Redist.14.Latest Microsoft.VisualStudio.Component.Windows11SDK.22000 --channelId VisualStudio.17.Release --norestart --passive --productId Microsoft.VisualStudio.Product.BuildTools
[1d44:0005][2024-11-05T02:37:56] Telemetry session ID: 8c0666e6-122f-43a2-8400-3c9a47d5d8d1
[1d44:0004][2024-11-05T02:37:56] Creating new ExperimentationService
```
Visual Studio Installer should download and install components requested.

# Install git - https://git-scm.com/downloads/win
```PowerShell
winget install --id Git.Git -e --source winget
```
sample output:
```
PS C:\Users\leet> winget install --id Git.Git -e --source winget
>>
Found Git [Git.Git] Version 2.47.0.2
This application is licensed to you by its owner.
Microsoft is not responsible for, nor does it grant any licenses to, third-party packages.
Downloading https://github.com/git-for-windows/git/releases/download/v2.47.0.windows.2/Git-2.47.0.2-64-bit.exe
  ██████████████████████████████  65.5 MB / 65.5 MB
Successfully verified installer hash
Starting package install...
Successfully installed
```

# Install Windows chocolatey package manager, helps with easy installation of additional components
```PowerShell
winget install --id chocolatey.chocolatey
```
sample output:
```
PS C:\Users\leet> winget install --id chocolatey.chocolatey
Found Chocolatey [Chocolatey.Chocolatey] Version 2.3.0.0
This application is licensed to you by its owner.
Microsoft is not responsible for, nor does it grant any licenses to, third-party packages.
Downloading https://github.com/chocolatey/choco/releases/download/2.3.0/chocolatey-2.3.0.0.msi
  ██████████████████████████████  6.03 MB / 6.03 MB
Successfully verified installer hash
Starting package install...
Successfully installed
Notes: The Chocolatey CLI MSI is intended for installation only! If upgrading from 5.x of Licensed Extension, or 1.x of other Chocolatey products, see the upgrade guide at https://ch0.co/upv2v6 before continuing. Otherwise, run `choco upgrade chocolatey`.
```

# Install Protobuf with chocolatey
```PowerShell
choco upgrade protoc -y
```
sample output:
```
PS C:\Users\leet> choco upgrade protoc -y
Chocolatey v2.3.0
Upgrading the following packages:
protoc
By upgrading, you accept licenses for the packages.
protoc is not installed. Installing...
Downloading package from source 'https://community.chocolatey.org/api/v2/'
Progress: Downloading chocolatey-compatibility.extension 1.0.0... 100%

chocolatey-compatibility.extension v1.0.0 [Approved]
chocolatey-compatibility.extension package files upgrade completed. Performing other installation steps.
 Installed/updated chocolatey-compatibility extensions.
 The upgrade of chocolatey-compatibility.extension was successful.
  Deployed to 'C:\ProgramData\chocolatey\extensions\chocolatey-compatibility'
Downloading package from source 'https://community.chocolatey.org/api/v2/'
Progress: Downloading chocolatey-core.extension 1.4.0... 100%

chocolatey-core.extension v1.4.0 [Approved]
chocolatey-core.extension package files upgrade completed. Performing other installation steps.
 Installed/updated chocolatey-core extensions.
 The upgrade of chocolatey-core.extension was successful.
  Deployed to 'C:\ProgramData\chocolatey\extensions\chocolatey-core'
Downloading package from source 'https://community.chocolatey.org/api/v2/'
Progress: Downloading protoc 28.3.0... 100%

protoc v28.3.0 [Approved]
protoc package files upgrade completed. Performing other installation steps.
Extracting 64-bit C:\ProgramData\chocolatey\lib\protoc\tools\protoc-28.3-win64.zip to C:\ProgramData\chocolatey\lib\protoc\tools...
C:\ProgramData\chocolatey\lib\protoc\tools
 ShimGen has successfully created a shim for protoc.exe
 The upgrade of protoc was successful.
  Deployed to 'C:\ProgramData\chocolatey\lib\protoc\tools'

Chocolatey upgraded 3/3 packages.
 See the log for details (C:\ProgramData\chocolatey\logs\chocolatey.log).
```

# Install rust
```PowerShell
winget install --id Rustlang.Rustup
```
sample ouput:
```
PS C:\Users\leet\src\vcpkg> winget install --id Rustlang.Rustup
Found Rustup: the Rust toolchain installer [Rustlang.Rustup] Version 1.27.1
This application is licensed to you by its owner.
Microsoft is not responsible for, nor does it grant any licenses to, third-party packages.
Downloading https://static.rust-lang.org/rustup/archive/1.27.1/x86_64-pc-windows-msvc/rustup-init.exe
  ██████████████████████████████  8.53 MB / 8.53 MB
Successfully verified installer hash
Starting package install...
Successfully installed
```

# Install nodejs
```PowerShell
winget install -e --id OpenJS.NodeJS
```
sample output:
```
PS C:\Users\leet> winget install -e --id OpenJS.NodeJS
  ████████████████████▍           1024 KB / 1.47 MB

Found Node.js [OpenJS.NodeJS] Version 23.1.0
This application is licensed to you by its owner.
Microsoft is not responsible for, nor does it grant any licenses to, third-party packages.
Downloading https://nodejs.org/dist/v23.1.0/node-v23.1.0-x64.msi
  ██████████████████████████████  29.5 MB / 29.5 MB
Successfully verified installer hash
Starting package install...
Successfully installed
```

# Get the Tari Universe code base
```PowerShell
cd src
git clone https://github.com/tari-project/universe.git
cd universe
```
sample output:
```
PS C:\Users\leet\src> git clone https://github.com/tari-project/universe.git
Cloning into 'universe'...
remote: Enumerating objects: 11632, done.
remote: Counting objects: 100% (1252/1252), done.
remote: Compressing objects: 100% (763/763), done.
remote: Total 11632 (delta 728), reused 852 (delta 486), pack-reused 10380 (from 1)
Receiving objects: 100% (11632/11632), 73.70 MiB | 6.15 MiB/s, done.
Resolving deltas: 100% (7824/7824), done.
Updating files: 100% (684/684), done.
```

# Install nodejs modules
```PowerShell
cd src/universe
npm.cmd --version
npm.cmd install
```
sample output:
```
PS C:\Users\leet\src\universe> npm.cmd --version
10.9.0
PS C:\Users\leet\src\universe> npm.cmd install
(node:9292) ExperimentalWarning: CommonJS module C:\Program Files\nodejs\node_modules\npm\node_modules\debug\src\node.js is loading ES Module C:\Program Files\nodejs\node_modules\npm\node_modules\supports-color\index.js using require().
Support for loading ES Module in require() is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead

added 481 packages, and audited 482 packages in 38s

150 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

# Install Cargo tools - tauri-cli
```Pow/universe
cargo install tauri-cli --version "2.1.0"
```
sample output:
```
PS C:\Users\leet\src\universe> cargo install tauri-cli --version "2.1.0"
>>
    Updating crates.io index
  Installing tauri-cli v2.1.0
    Updating crates.io index
       Fetch [===========>                     ] 48 complete; 1 pending
```
...
```
   Compiling os_info v3.8.2
   Compiling itertools v0.13.0
   Compiling shared_child v1.0.1
   Compiling ctrlc v3.4.5
   Compiling common-path v1.0.0
    Building [=======================> ] 491/492: cargo-tauri(bin)
    Finished `release` profile [optimized] target(s) in 13m 14s
  Installing C:\Users\leet\.cargo\bin\cargo-tauri.exe
   Installed package `tauri-cli v2.1.0` (executable `cargo-tauri.exe`)
```
```PowerShell
cargo tauri --version
```
sample output:
```
  tauri-cli 2.1.0
```

# Build from source for ```Tari Universe Alpha```
```PowerShell
cd src/universe
cargo tauri build --bundles none
```
sample output:
```
PS C:\Users\leet\src\universe> cargo tauri build --bundles none
     Running beforeBuildCommand `npm run build`

> tari-universe@0.6.15 build
> tsc && vite build

[sentry-vite-plugin] Warning: No auth token provided. Will not create release. Please set the `authToken` option. You can find information on how to generate a Sentry auth token here: https://docs.sentry.io/api/auth/
[sentry-vite-plugin] Warning: No auth token provided. Will not upload source maps. Please set the `authToken` option. You can find information on how to generate a Sentry auth token here: https://docs.sentry.io/api/auth/
node_modules/lottie-web/build/player/lottie.js (17010:32): Use of eval in "node_modules/lottie-web/build/player/lottie.js" is strongly discouraged as it poses security risks and may cause issues with minification.
   Compiling ring v0.17.8
   Compiling libsqlite3-sys v0.25.2
   Compiling vswhom-sys v0.1.2
   Compiling zstd-sys v2.0.13+zstd.1.5.6
   Compiling bzip2-sys v0.1.11+1.0.8
   Compiling lzma-sys v0.1.20
   Compiling rustls v0.23.16
   Compiling vswhom v0.1.0
   Compiling embed-resource v2.5.0
   Compiling bzip2 v0.4.4
   Compiling zstd-safe v7.2.1
   Compiling zstd v0.13.2
   Compiling tauri-winres v0.1.1
   Compiling xz2 v0.1.7
   Compiling zip v2.2.0
   Compiling tauri-build v1.5.5
   Compiling async-compression v0.4.17
   Compiling rustls-webpki v0.102.8
   Compiling rcgen v0.12.1
   Compiling jsonwebtoken v9.3.0
   Compiling async_zip v0.0.17
   Compiling tari-universe v0.6.15 (C:\Users\leet\src\universe\src-tauri)
   Compiling tokio-rustls v0.26.0
   Compiling hickory-proto v0.25.0-alpha.2
   Compiling tonic v0.12.3
   Compiling diesel v2.2.4
   Compiling hickory-resolver v0.25.0-alpha.2
   Compiling hickory-client v0.25.0-alpha.2
   Compiling diesel_migrations v2.2.0
   Compiling tari_common_sqlite v1.8.0-pre.0 (https://github.com/tari-project/tari.git?branch=development#e61b5e2d)
   Compiling tari_comms_dht v1.8.0-pre.0 (https://github.com/tari-project/tari.git?branch=development#e61b5e2d)
   Compiling tari_key_manager v1.8.0-pre.0 (https://github.com/tari-project/tari.git?branch=development#e61b5e2d)
   Compiling tari_p2p v1.8.0-pre.0 (https://github.com/tari-project/tari.git?branch=development#e61b5e2d)
   Compiling tari_core v1.8.0-pre.0 (https://github.com/tari-project/tari.git?branch=development#e61b5e2d)
   Compiling minotari_app_grpc v1.8.0-pre.0 (https://github.com/tari-project/tari.git?branch=development#e61b5e2d)
   Compiling minotari_wallet_grpc_client v0.1.0 (https://github.com/tari-project/tari.git?branch=development#e61b5e2d)
   Compiling minotari_node_grpc_client v0.1.0 (https://github.com/tari-project/tari.git?branch=development#e61b5e2d)
warning: method `to_string` is never used
  --> src\hardware\hardware_status_monitor.rs:41:12
   |
39 | impl HardwareVendor {
   | ------------------- method in this implementation
40 |     #[allow(clippy::inherent_to_string)]
41 |     pub fn to_string(&self) -> String {
   |            ^^^^^^^^^
   |
   = note: `#[warn(dead_code)]` on by default

warning: method `assign_port` is never used
  --> src\port_allocator.rs:51:12
   |
12 | impl PortAllocator {
   | ------------------ method in this implementation
...
51 |     pub fn assign_port(&self) -> Result<u16, Error> {
   |            ^^^^^^^^^^^

warning: `tari-universe` (bin "tari-universe") generated 2 warnings
    Finished `release` profile [optimized] target(s) in 9m 01s
        Warn The updater is enabled but the bundle target list does not contain `updater`, so the updater artifacts won't be generated.
```

# Troubleshooting:
If you run into the following error, possible on first run or after a ```cargo clean```:
```
error: failed to run custom build command for `randomx-rs v1.3.2 (https://github.com/tari-project/randomx-rs?branch=development#991f32d4)`

Caused by:
  process didn't exit successfully: `C:\Users\leet\src\universe\src-tauri\target\release\build\randomx-rs-a4945cfcb3d79de5\build-script-build` (exit code: 101)
  --- stdout
  'Visual Studio 17 2022' not found, trying 'Visual Studio 16 2019'

  --- stderr
  thread 'main' panicked at C:\Users\leet\.cargo\git\checkouts\randomx-rs-d73fe46043d03ed8\991f32d\build.rs:105:13:
  CMake failed with either Visual Studio 2022 (

  ) or 'Visual Studio 16 2019' (

  ) or (
  program not found
  )
```
or possible
```
   Compiling minotari_node_grpc_client v0.1.0 (https://github.com/tari-project/tari.git?branch=development#e61b5e2d)
   Compiling minotari_wallet_grpc_client v0.1.0 (https://github.com/tari-project/tari.git?branch=development#e61b5e2d)
   Compiling sysinfo v0.31.4
error: linking with `link.exe` failed: exit code: 1120
  |
  = note: "C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\BuildTools\\VC\\Tools\\MSVC\\14.42.34433\\bin\\HostX64\\x64\\link.exe" "/NOLOGO" "C:\\Users\\leet\\AppData\\Local\\Temp\\rustcEFU9S6\\symbols.o" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\tari_universe.tari_universe.88854ec1c11f88-cgu.00.rcgu.o" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\tari_universe.tari_universe.88854ec1c11f88-cgu.01.rcgu.o" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\tari_universe.tari_universe.88854ec1c11f88-cgu.02.rcgu.o" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\tari_universe.tari_universe.88854ec1c11f88-cgu.03.rcgu.o" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\tari_universe.tari_universe.88854ec1c11f88-cgu.04.rcgu.o" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\tari_universe.tari_universe.88854ec1c11f88-cgu.05.rcgu.o" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\tari_universe.tari_universe.88854ec1c11f88-cgu.06.rcgu.o" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\tari_universe.tari_universe.88854ec1c11f88-cgu.07.rcgu.o" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\tari_universe.tari_universe.88854ec1c11f88-cgu.08.rcgu.o" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\tari_universe.tari_universe.88854ec1c11f88-cgu.09.rcgu.o" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\tari_universe.tari_universe.88854ec1c11f88-cgu.10.rcgu.o" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\tari_universe.tari_universe.88854ec1c11f88-cgu.11.rcgu.o" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\tari_universe.tari_universe.88854ec1c11f88-cgu.12.rcgu.o" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\tari_universe.tari_universe.88854ec1c11f88-cgu.13.rcgu.o" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\tari_universe.tari_universe.88854ec1c11f88-cgu.14.rcgu.o" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\tari_universe.tari_universe.88854ec1c11f88-cgu.15.rcgu.o" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\tari_universe.6uci2knwehyzhrukdmtgqiejj.rcgu.o" "/LIBPATH:C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps" "/LIBPATH:C:\\Users\\leet\\.cargo\\registry\\src\\index.crates.io-6f17d22bba15001f\\windows_x86_64_msvc-0.52.6\\lib" "/LIBPATH:C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\build\\bzip2-sys-8245143335534f77\\out\\lib" "/LIBPATH:C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\build\\lzma-sys-9156e1be477a59af\\out" "/LIBPATH:C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\build\\zstd-sys-27861384ac7766e4\\out" "/LIBPATH:C:\\Users\\leet\\.cargo\\registry\\src\\index.crates.io-6f17d22bba15001f\\windows_x86_64_msvc-0.48.5\\lib" "/LIBPATH:C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\build\\ring-a5f230815d840132\\out" "/LIBPATH:C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\build\\libsqlite3-sys-14df6caacc44d662\\out" "/LIBPATH:C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\build\\liblmdb-sys-a29da5e185f0dc98\\out" "/LIBPATH:C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\build\\randomx-rs-b9ade373c73eefd4\\out\\randomx_build\\Release" "/LIBPATH:C:\\Users\\leet\\.cargo\\registry\\src\\index.crates.io-6f17d22bba15001f\\windows_x86_64_msvc-0.42.2\\lib" "/LIBPATH:C:\\Users\\leet\\.cargo\\registry\\src\\index.crates.io-6f17d22bba15001f\\windows_x86_64_msvc-0.37.0\\lib" "/LIBPATH:C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\build\\webview2-com-sys-83bd7d28f4faea8d\\out\\x64" "/LIBPATH:C:\\Users\\leet\\.cargo\\registry\\src\\index.crates.io-6f17d22bba15001f\\windows_x86_64_msvc-0.39.0\\lib" "/LIBPATH:C:\\Users\\leet\\.rustup\\toolchains\\1.80.0-x86_64-pc-windows-msvc\\lib\\rustlib\\x86_64-pc-windows-msvc\\lib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtauri_plugin_single_instance-fa15bfb5db6b6c78.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libopen-0b9c38925721676a.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libphraze-8bd54cb2ce33d241.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libinclude_lines-55e345439ef4ced1.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libclap-b1275476cc53bcb0.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libclap_builder-f35c185d188d4611.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libstrsim-9da883d2d4f0c62a.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libanstream-d920e910ba8c7d20.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libanstyle_query-5121f858c09e9ac2.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libis_terminal_polyfill-8c5f6612523d4bb2.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libanstyle_wincon-44658c4304848d5b.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libcolorchoice-a5d2b1a5e762ec74.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libanstyle_parse-5ad0d207623ad134.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libutf8parse-d446ca8aea58a869.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libclap_lex-1a1921547f4ddd2d.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libanstyle-2734df439e2f9f65.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsanitize_filename-ac46566ff23aee3f.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libdevice_query-e03ae8506c3f698f.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwindows-7aad2dd2ba4b106e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libjsonwebtoken-5cd9eb0d34436092.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsimple_asn1-663e2bcaa133a11a.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhuman_format-bf77e9e421204f3c.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsentry_tauri-342ea588643eab75.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsentry_rust_minidump-d06203e5d673b648.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libminidumper_child-b89d80d24dd51aee.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libminidumper-aee7cf741bc42a2f.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libminidump_writer-b2a3a2580bbf4eab.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libminidump_common-8cc19889a7455738.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\librange_map-c36db26187386d12.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libscroll-2049f66328cd281b.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libpolling-a24e8233438c79e0.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libconcurrent_queue-4bb6a6fe3c06a0e2.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libcrash_handler-229499b8bae26d7e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libcrash_context-f379d51e9af5b1f2.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libminotari_node_grpc_client-71dc4c2998f921a9.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libminotari_app_grpc-5989b81db15b8a95.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\librcgen-ea17bb55d1b24f4b.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libyasna-32760f280e627988.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libpem-acc7fae3bbdc34e9.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libprost_types-2916b7c0f2050630.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtonic-3e8a572de2c036e2.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhyper_timeout-255dbdb84eeb488c.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libasync_stream-0cafe3922a627cbd.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libaxum-3726a71d50242321.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libmatchit-b9016985efcb9c33.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libaxum_core-2ce72704ae2e29ba.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtower-58b18de1278595a6.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libkeyring-22426aa3c67cb5e5.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libnvml_wrapper-9e910c6bd542f7de.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libnvml_wrapper_sys-c459b71da272a081.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\liblibloading-ec327f831018c4a1.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libdyn_clone-66ce886cba17a802.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsysinfo-0c959452b2522aff.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libntapi-8e4e40a8f76cc03d.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwindows-e92c7f2d92fded52.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwindows_core-ac819dceb01f2574.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwindows_result-1074c3f4a9e7c80f.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\librayon-dc297bf951c67130.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\librayon_core-e668a9aa3c949933.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libzip-57c637eae82cab48.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libpbkdf2-eb380fde4e8093f5.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libzopfli-660e75c34a5cb16c.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbumpalo-46f066a436339e72.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\liblockfree_object_pool-f050e0d9238c00e9.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\liblzma_rs-e5ab8c02197b9e8e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libcrc-ebb10dfbd027ad7b.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libcrc_catalog-ea6c5cbb2d9d0d15.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsha1-0250bc1b70e1cbd9.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhmac-bf166f9f0a0bd97e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libconstant_time_eq-fb054813fd4242fd.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwinreg-39165c07ab42989a.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libasync_zip-4b4b697adcdcf22d.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libasync_compression-eace709a5123f05e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libzstd-cea40bab4dfe7d4d.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libzstd_safe-62253c73daae8abf.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libzstd_sys-38c3a03e94010352.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libxz2-62a5a0c073426356.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\liblzma_sys-c352592193e3f54d.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libdeflate64-db3dca5c358d8f0c.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbzip2-154fff5f4364d23b.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbzip2_sys-632060ca93a2f2df.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libfutures_lite-362ae118c0a33c89.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libparking-10aee49fad336d14.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libauto_launch-7752a008cdc99af3.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwinreg-21e4baae8acef064.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtauri-04885ff4378cb693.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libico-b7d98dce0403e284.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libpng-74b60038d4a9be07.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libfdeflate-e40a533102c89dc3.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libopen-2129634965967242.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwindows_sys-7fcafd21f9a96344.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libdirs_next-c888e0d87928b2a3.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsys_locale-580b07b073958f6e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libzip-5465a7e9b2f3afd9.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtar-616011c7b6c8da6f.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libfiletime-e0ddde7aafca5b66.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libflate2-f1fcb11215706156.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libminiz_oxide-af044428259db5cc.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsimd_adler32-7772193a5c4b4958.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\librfd-8858534babdf8395.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwindows-403390b859bf10b9.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtauri_runtime_wry-5df740d75db23791.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwry-56baf297331601fb.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtao-ce3452ccfe765427.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libunicode_segmentation-de301ff2a17220b2.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libcrossbeam_channel-661e98f10129356f.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libinstant-570af316534742a2.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwebview2_com-a25deb9330fed75c.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwebview2_com_sys-89fb5a64e9803fbd.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libminisign_verify-6338c9c5c03b52ea.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libstate-d4a913240db4f84e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtauri_runtime-d6acf75d71e0360e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwindows-b0ff6ec1f306f2c3.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhttp_range-5286417b8df34ac4.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libraw_window_handle-3bc49f6bd3b7945a.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtauri_utils-a4b51c1fdf76caa0.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libdunce-c8f0cf2c9280da6c.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libglob-40f5996237144e18.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwindows_version-f64b625bc20cdec1.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libinfer-90db72ad475cb4a5.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libcfb-fd01285212f3388c.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbrotli-91025a6d967e016a.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbrotli_decompressor-731561c9e66ff347.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\liballoc_stdlib-a8b8b5b18ea21d68.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\liballoc_no_stdlib-03ee534da11fc3b1.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libkuchikiki-0f2054d8e0b1952f.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libselectors-ff5249e93bd341ed.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libthin_slice-9324b38a8b1d8a96.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libservo_arc-aa2b5c7d7ae6ed1f.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libnodrop-86d7e15e0181b5fb.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libfxhash-d3731125b72edd4f.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libcssparser-09307b3bb54f758e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libitoa-896d6f9e21864154.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libdtoa_short-5218fec87b2a7571.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libdtoa-31eb83241737c40a.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libphf-23253e082bf75a3b.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libphf_shared-94b6ae6aa850a4fb.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libmatches-680faca561b97506.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhtml5ever-3bc2c3241a53dbc2.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libmarkup5ever-fb05bd2ea6b02449.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libstring_cache-3a17a8229f59b603.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libprecomputed_hash-13d594fb544c2f54.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libphf-c422488b736e46cb.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libphf_shared-60716c022f1480f5.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtendril-c9577ce564304835.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libutf8-aae2ce1daaecbc7a.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libfutf-427b4397b2b74a14.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libdebug_unreachable-6bb49bfbc732d08a.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libmac-0d9db9c7c287ec6e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libjson_patch-9e9afce10cfbf1a4.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libjsonptr-b6c6a9773e5e7486.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libserde_with-d4179981e5ed9a1e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libphf-26d24e413f5be786.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libphf_shared-8cd35fe4af2161cc.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsiphasher-bf874a044aa24648.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsemver-c5157a2f085e26b5.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libshared_child-df9585d08d5f1a89.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libos_pipe-2679243ef1112675.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libserialize_to_javascript-0a46f74059d4f838.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libreqwest-cddc4a1fa986462c.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\librustls_pemfile-4e6170906151fb42.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhyper_tls-fe7737411afab278.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhyper-bd1d3ec58cf75658.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libh2-67a92dbffd8f5e70.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsync_wrapper-4f703bf6920b5cec.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhttp_body-e5310b82a64f0cc2.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhttp-d1a2c6416853fdce.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libignore-25e84d6c4e55ed02.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwalkdir-36c51049d2885350.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsame_file-cb4a2956ea4e4c24.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libcrossbeam_deque-0b16eaa8da50f20e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libcrossbeam_epoch-ccf806935ffcd7bd.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libcrossbeam_utils-fc1491f32dbe8958.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwinapi_util-59c5f9620272f202.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libglobset-50930a858d3ca5cf.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbstr-4ebeb09c1e40897b.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtari_core-fabae97f0ad0327e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libdecimal_rs-662a9966142d2e77.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libstack_buf-a7ca79facaab5c3a.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtari_p2p-6becbafa05531c61.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwebpki_roots-403d7220d6d3d36d.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhickory_resolver-2763f00119a62ec7.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libipconfig-79bd19d24bdab806.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwinreg-11c62205836faab1.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwindows_sys-de92acf689695279.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwindows_targets-c5988d99c34d1af2.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwidestring-c29d85494045f627.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\liblru_cache-4ac3af59c0ad186d.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\liblinked_hash_map-c2fe7f99211a53e8.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhickory_client-67557a800ff70430.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libradix_trie-e51de64b7f10b625.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libnibble_vec-674806617ce08a5e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libendian_type-98bf09f7ebd64f92.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhickory_proto-961cd5eefef8f660.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtokio_rustls-78c71db999593ecd.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\librustls-089ed852722f711d.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwebpki-95fa76639c2cc4ca.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libidna-c406f4e4095885f9.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libunicode_normalization-f655c39d000e4761.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libunicode_bidi-24ec2dbecd8dc21c.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtinyvec-698673075dc6ac33.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtinyvec_macros-29c07a28985a97ed.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libring-1dc62477940af59d.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libspin-cb012829d2083e97.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libuntrusted-620c9037d473f6b4.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtari_comms_dht-1f77f3036865e6bf.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libpin_project-3287f5469050ec0e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtari_test_utils-d5cb3af0db17ab82.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtempfile-a6a4fe29ae3299ad.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libfastrand-c813157e05212348.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtari_comms-247b1a2e28b3d048.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libcidr-aedf3ec9e1490b44.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbitstring-db531b935f27606b.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsnow-eee28ce781787a5d.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libaes_gcm-122039cacb7637c2.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libctr-1d5c32874ba1852a.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libghash-cb1b136af79c4017.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libpolyval-f93803f8ef8c7a71.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libaes-115ba60d70e5159c.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libyamux-50101823895f4c45.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libnohash_hasher-2a44112594cffc8c.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libweb_time-a653064e8765f962.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libprost-fcb074f8aeb7ca5f.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtokio_util-f5d0808ff25ff7a6.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtokio_stream-106d92c8567086da.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtower-51a08dfb3842f5de.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libpin_project-2b8e10860744a4a2.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libindexmap-9e5e0136a75aaaf7.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhashbrown-e60e8dbd06d71a87.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhdrhistogram-feb8fd210124efb2.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtower_layer-4f661f936529e09b.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\librandomx_rs-3dd023e4c006ba18.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbytes-8c8f1fd5488ec28b.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtari_tiny_keccak-16b87e5f6526fc0b.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libmonero-15c65f4e804f2f81.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhex_literal-a86b9c05fcd550da.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtiny_keccak-08bd3c4e507f45ad.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libnum_format-0da5ad5ce7168ec6.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libarrayvec-e4b2d3c93d64dcb3.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libfs2-89126f288eb3a8c5.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtari_storage-92e187574ec8b727.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\liblmdb_zero-6a0f2bb6df4fa2e1.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbitflags-f0ed0ef41173ccdc.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsupercow-11b3933ce6890ece.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libliblmdb_sys-1afe1ef2a8a44721.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\liblibc-e2ce618c4b65b7aa.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtari_hashing-09e0879f8ee3c300.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtari_script-4ff42106a64c4c35.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsha2-6ed40d46aeb98858.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libinteger_encoding-7ccc0e1524d23e96.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtari_max_size-2e73a00c40acc26e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtari_key_manager-d99e0457a909afd6.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtari_service_framework-6d5408241ba713a0.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtari_shutdown-8df8c8bad2cc5af3.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libfutures-21d5af09154213b1.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libfutures_executor-fca54187ee1a0399.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtari_common_sqlite-66c920e029f8871a.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libdiesel_migrations-fb4d56420921c9a1.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libmigrations_internals-95047427fc4e55e2.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libdiesel-040a0a0645ee3f9f.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libr2d2-e7a2f94cf09812ba.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libscheduled_thread_pool-daf853bc063cba2e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbigdecimal-d977c588d61b5594.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\liblibm-2d57ddc4729a9695.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libnum_bigint-05edd2f57c5e8d0e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libnum_integer-a27626eb4265abc8.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\liblibsqlite3_sys-bd18f6989d75d175.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libargon2-abe8a61e8466e721.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libpassword_hash-958fae4cd3e60231.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbase64ct-55ce5d7641cbc22c.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libcrc32fast-32868f3aef6210cc.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libchacha20-ada19252ee2a5bd6.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libcipher-61f3bf80841808a8.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtari_mmr-a840fca1ceed2854.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtari_common_types-2b3e9a0e1f08ff0b.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libstrum-0b88155dcf026ca3.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbitflags-ce71b57ed295ab58.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbase64-637380d030398538.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libminotari_ledger_wallet_common-14e9b0b7cff28f48.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbs58-1365b13fb0681b51.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libnewtype_ops-f497ca4d2f1bf7da.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libchacha20poly1305-d2b9623bb94e58bd.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libchacha20-cee3282565e8e8af.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libpoly1305-0b8bec5854098d48.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libopaque_debug-623c7f184c7485d2.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libuniversal_hash-06003d7142d5996f.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libaead-72049c9b2ca83741.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libcipher-7b9a614a0db707a9.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libinout-2f2414b6e1796417.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libprimitive_types-22069f0926f25cd7.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libimpl_serde-28208af2136641cc.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libuint-34080e9ec1769267.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libcrunchy-d0024693f29b5c5a.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libfixed_hash-09d12be378243cb9.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\librustc_hex-d37ed8b4d563d8fb.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtari_crypto-050c00810064bb8c.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtari_bulletproofs_plus-9bf5ee773ed10111.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libmerlin-db9119a60f3b2f7f.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libitertools-42ac9667d7c597ba.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libeither-87c84d046cbeea36.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libthiserror_no_std-9f688df911b083b9.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libcurve25519_dalek-f7b770063a8427e4.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libcpufeatures-b62905442cc0e298.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libgroup-2876026bbc7fedf3.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libff-6a44755f6dcc2593.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsha3-d4d14ac9565aad9f.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libkeccak-b69d00c001571935.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libblake2-dc840333311a56e8.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libdigest-18c8a4bb3e9f4b9d.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libblock_buffer-c864f253d1063abc.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libcrypto_common-d1d4b1d88bacefff.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libgeneric_array-3b9baaafdae2b718.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtypenum-1ce0119cede8962a.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtari_utilities-d625699f5ab5d0a3.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbase64-83da9829ec31b65e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbincode-22732bda0c900eaf.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbase58_monero-318efe8141e496cb.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsubtle-58ba84bdf5b6ef33.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libzeroize-49cfa177419929b9.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libborsh-a1d20dd066cdd671.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsnafu-aa0e64d8d818528c.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libdoc_comment-d6c66490b8811c5b.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtari_common-7d71dd7928763a5b.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libdirs_next-392096813aae0d37.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libdirs_sys_next-f0b9bd17c25d5f9a.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libpath_clean-ffb1a2a14a524c7d.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libmultiaddr-2998eef61f24cc38.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbs58-86c0eb7915a3df06.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libstatic_assertions-6c489d2aae3abab5.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libdata_encoding-bdc03184baa2a6cb.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libarrayref-4e6796dd112d0b10.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libmultihash-bff52ec2deddf11a.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libunsigned_varint-b175bfa4822e4da7.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libconfig-5cef5665e72f75c4.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libpathdiff-8d93603a52100bd7.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtoml-6ce3cfc4b7b399a5.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtoml_edit-be2bd15e8061b0d6.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libserde_spanned-33a75a26aea79a8a.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwinnow-39f2025a26a57471.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtoml_datetime-bc8d44533fbde7df.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libnom-f23f72a0cc097e55.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libstructopt-0b08f6c4a73caca5.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\liblazy_static-4cdfd95f39ec9811.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libclap-b3d986ff7c683274.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtextwrap-832bb62df8c36c8c.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libunicode_width-ba1abb38a71e1d39.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbitflags-a20cf15ca168c664.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtari_features-5f1544cd0a3a8875.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\liblog4rs-5534308ba48a67ba.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\liblog_mdc-2091c17b7c7a6960.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libthread_id-226ea1a0dd0eab7b.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhumantime-3b0c0b115bd31fcf.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libserde_yaml-f253b4ec47c01f01.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libunsafe_libyaml-06398810ea271198.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtypemap_ors-2d0f37e442a1c545.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libunsafe_any_ors-39c05dcde9718b00.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libdestructure_traitobject-e6d471071f1fab5c.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libchrono-3099e570663f8db1.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libserde_value-276e193017e656d4.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libordered_float-af9f2e118293f234.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libnum_traits-a77739b9714c91da.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libarc_swap-ed8b4269e7d5571a.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsentry-7891ea9f10034cfb.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsentry_panic-6881431dfe37cdbd.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsentry_debug_images-6024cafd1be93c3b.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libfindshlibs-2026611796de7280.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwinapi-95965f20807feda2.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsentry_contexts-345041ac9f0700c5.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhostname-2c51c23c97105a3a.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwindows-da525877a6768253.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwindows_core-aab42807ce47d129.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libos_info-e4bc67ba148c5d8e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsentry_anyhow-86cb5f304e443c66.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsentry_backtrace-14a9cb98fde3c851.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbacktrace-633a469a6441f5eb.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\librustc_demangle-ffd73723b268bef5.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libregex-c70e5eab2ff75881.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libregex_automata-fb5afc5decac0885.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libaho_corasick-0aec4b2098bd80cb.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libregex_syntax-62da80ea965f9768.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libanyhow-ee6d9e90a34b687f.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libreqwest-20381162c0fe1e04.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\librustls_pemfile-9aa4c34b0fe17993.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\librustls_pki_types-ad8d111d776c2bff.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwindows_registry-036831a4464acf07.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwindows_strings-ad4689fd22f8f3fd.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwindows_result-0592a48f86914b39.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsync_wrapper-7510435d1e4df06f.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbase64-8b77ecde050665f8.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libipnet-41564af9c00ce164.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhyper_tls-e9fcca31d7a15afd.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtokio_native_tls-1139d0ae5b098bb2.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libserde_urlencoded-8e8e0efc70d5f799.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libencoding_rs-f2c7e97d3562e97d.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libmime_guess-838bd92791557ec0.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libunicase-fcf54f051ec0ea5c.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libmime-40dce5866388b813.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libnative_tls-85b392c3e5009519.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libschannel-b30ee3942c71849a.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwindows_sys-1755deb75f774c15.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhyper_util-56b1c114fbcea8d9.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtower_service-1d711ffb7719fff5.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhyper-4ff026adfca84add.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwant-b177ad494a9d721f.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtry_lock-9cedd6ec967c928a.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhttparse-e4d7bea8d316fff6.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libh2-94d18633841cd578.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtracing-56bfd7bed26e499e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtracing_core-ac79366d3c8ed26d.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libatomic_waker-6ecd9123f7cfc427.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtokio_util-202c4e4a67faba69.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtokio-7c3b56a62c3f153e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsocket2-dd4fa65b41a52d22.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libmio-f33adfcf46c14068.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwindows_sys-6836dff3cf96510f.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libparking_lot-8aad914bf3e08f1c.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libparking_lot_core-347437538ef8cccf.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwindows_targets-1f110253fe1c3ce3.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\liblock_api-102c20216d0a69db.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libscopeguard-c1bbcde97e547d02.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhttp_body_util-d8b6cb804c51b34d.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhttp_body-8163f46a818c97a2.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\liblog-53e4a5e9f1df5dd7.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libfutures_util-dff6235dae3ed5cb.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libfutures-3014ade12d6b4d56.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libfutures_io-ba91a33338c4ddcc.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libslab-3f5835e6a5413e54.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libfutures_channel-09e6f7147f375925.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libpin_project_lite-88e6736917d45a16.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libfutures_sink-d7b4a8d89ed991b9.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libfutures_task-3ab86e612f325e71.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libpin_utils-0bf152b1db31f304.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libfutures_core-9ab7bed93120670b.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhttp-1544af24059442df.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbytes-f9dcd4f9f2b1be8f.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libfnv-9f15c42e468e9ee8.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhttpdate-6222d423e4bce788.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsentry_core-18a0046982fcf7b0.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libonce_cell-1ba0f0ef9d6ae13f.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libportable_atomic-40e72e2454ceb6d4.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsentry_types-2dde7dddac73d550.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhex-93f97d9d02fbd5d3.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\librand-5d473a0ab7c2bc9c.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\librand_chacha-365fea28308b68ef.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libppv_lite86-9ad1095ccf60ba54.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libzerocopy-6691cb5bd1146529.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libbyteorder-85fcf2a584aa52fd.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\librand_core-d7208da96b5ca24f.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtime-16fc92ed43d6ff23.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtime_core-4a6cf74fc79885e9.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libnum_conv-d1f1c6e7aa3f2a72.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libderanged-2b28b1ca1ec78238.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libpowerfmt-07392501352da9e7.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libdebugid-c12f9cbb1cec38fc.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libserde_json-1db5e188af918581.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libmemchr-8d1d49c2a825bcf8.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libitoa-cc1c9c44b6ba5258.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libryu-8ae206e4aa0258df.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libindexmap-990523e052283bab.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libequivalent-9ee81f9c066221d4.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libhashbrown-10856881a45479b1.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libuuid-fdba619b9140b705.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libgetrandom-1b6074790845a7cb.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libcfg_if-a51426f3dee4ceec.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\liburl-d1f2bfd54f47b648.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libidna-57af911b8faf736f.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libidna_adapter-f2bf0786f24c2e47.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libicu_normalizer-9df3be4398ed5018.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libicu_normalizer_data-a8d95e3607d9f174.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwrite16-0b9d86de2a2d2891.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libutf8_iter-ae49a5c2c9d3e3a8.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libutf16_iter-84d338b97e485723.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libsmallvec-6b1999056408b39e.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libicu_properties-4eeb0cd5fd88453d.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libicu_properties_data-187609a4026f1034.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libicu_locid_transform-c9468dbc09f477a4.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libicu_locid_transform_data-3dcc4e29c782dce5.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libicu_collections-3a3809a6c9376b57.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libicu_provider-2f77d3c78439c75b.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libicu_locid-5a6955602694b4e0.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\liblitemap-d0a5783d7aa43062.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libtinystr-60bc5f2a68947d94.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libzerovec-5d7217270493b1c6.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libwriteable-13002a2b56afeb60.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libyoke-0aa5e656ce9e6d80.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libzerofrom-e0ac0a9dc603d0b8.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libstable_deref_trait-ef345d0b926b5b8c.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libform_urlencoded-82d7eead2ae97e54.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libpercent_encoding-b78bcb9fc6fa6a87.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libthiserror-6f5ee2e1d97a05f4.rlib" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\libserde-a3ba46416df73def.rlib" "C:\\Users\\leet\\.rustup\\toolchains\\1.80.0-x86_64-pc-windows-msvc\\lib\\rustlib\\x86_64-pc-windows-msvc\\lib\\libstd-d12b180ae2af61db.rlib" "C:\\Users\\leet\\.rustup\\toolchains\\1.80.0-x86_64-pc-windows-msvc\\lib\\rustlib\\x86_64-pc-windows-msvc\\lib\\libpanic_unwind-1381ab952b622680.rlib" "C:\\Users\\leet\\.rustup\\toolchains\\1.80.0-x86_64-pc-windows-msvc\\lib\\rustlib\\x86_64-pc-windows-msvc\\lib\\librustc_demangle-1794455ce6ed0225.rlib" "C:\\Users\\leet\\.rustup\\toolchains\\1.80.0-x86_64-pc-windows-msvc\\lib\\rustlib\\x86_64-pc-windows-msvc\\lib\\libstd_detect-98dc43491332ac14.rlib" "C:\\Users\\leet\\.rustup\\toolchains\\1.80.0-x86_64-pc-windows-msvc\\lib\\rustlib\\x86_64-pc-windows-msvc\\lib\\libhashbrown-e2fbb1b09eb940eb.rlib" "C:\\Users\\leet\\.rustup\\toolchains\\1.80.0-x86_64-pc-windows-msvc\\lib\\rustlib\\x86_64-pc-windows-msvc\\lib\\librustc_std_workspace_alloc-88a772a449b80298.rlib" "C:\\Users\\leet\\.rustup\\toolchains\\1.80.0-x86_64-pc-windows-msvc\\lib\\rustlib\\x86_64-pc-windows-msvc\\lib\\libunwind-988c60333ed1506a.rlib" "C:\\Users\\leet\\.rustup\\toolchains\\1.80.0-x86_64-pc-windows-msvc\\lib\\rustlib\\x86_64-pc-windows-msvc\\lib\\libcfg_if-6889e9249d1a467b.rlib" "C:\\Users\\leet\\.rustup\\toolchains\\1.80.0-x86_64-pc-windows-msvc\\lib\\rustlib\\x86_64-pc-windows-msvc\\lib\\liballoc-47499d42920da425.rlib" "C:\\Users\\leet\\.rustup\\toolchains\\1.80.0-x86_64-pc-windows-msvc\\lib\\rustlib\\x86_64-pc-windows-msvc\\lib\\librustc_std_workspace_core-964c9365d723678c.rlib" "C:\\Users\\leet\\.rustup\\toolchains\\1.80.0-x86_64-pc-windows-msvc\\lib\\rustlib\\x86_64-pc-windows-msvc\\lib\\libcore-66f9258885a5c25f.rlib" "C:\\Users\\leet\\.rustup\\toolchains\\1.80.0-x86_64-pc-windows-msvc\\lib\\rustlib\\x86_64-pc-windows-msvc\\lib\\libcompiler_builtins-2c70b87fa94bad5f.rlib" "windows.0.48.5.lib" "kernel32.lib" "ws2_32.lib" "kernel32.lib" "dbghelp.lib" "kernel32.lib" "windows.0.52.0.lib" "ntdll.lib" "windows.0.52.0.lib" "windows.0.52.0.lib" "windows.0.52.0.lib" "windows.lib" "kernel32.lib" "windows.lib" "windows.lib" "windows.0.52.0.lib" "iphlpapi.lib" "windows.0.48.5.lib" "legacy_stdio_definitions.lib" "windows.0.52.0.lib" "advapi32.lib" "cfgmgr32.lib" "credui.lib" "gdi32.lib" "kernel32.lib" "msimg32.lib" "ole32.lib" "opengl32.lib" "psapi.lib" "secur32.lib" "shell32.lib" "user32.lib" "winspool.lib" "windows.0.52.0.lib" "windows.0.52.0.lib" "windows.0.52.0.lib" "windows.0.52.0.lib" "windows.0.52.0.lib" "windows.0.52.0.lib" "windows.0.52.0.lib" "windows.0.52.0.lib" "windows.0.52.0.lib" "bcrypt.lib" "advapi32.lib" "kernel32.lib" "advapi32.lib" "kernel32.lib" "ntdll.lib" "userenv.lib" "ws2_32.lib" "kernel32.lib" "ws2_32.lib" "kernel32.lib" "/defaultlib:msvcrt" "/NXCOMPAT" "/LIBPATH:C:\\Users\\leet\\.rustup\\toolchains\\1.80.0-x86_64-pc-windows-msvc\\lib\\rustlib\\x86_64-pc-windows-msvc\\lib" "/OUT:C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\deps\\tari_universe.exe" "/SUBSYSTEM:windows" "/ENTRY:mainCRTStartup" "/OPT:REF,ICF" "/DEBUG" "/PDBALTPATH:%_PDB%" "/NATVIS:C:\\Users\\leet\\.rustup\\toolchains\\1.80.0-x86_64-pc-windows-msvc\\lib\\rustlib\\etc\\intrinsic.natvis" "/NATVIS:C:\\Users\\leet\\.rustup\\toolchains\\1.80.0-x86_64-pc-windows-msvc\\lib\\rustlib\\etc\\liballoc.natvis" "/NATVIS:C:\\Users\\leet\\.rustup\\toolchains\\1.80.0-x86_64-pc-windows-msvc\\lib\\rustlib\\etc\\libcore.natvis" "/NATVIS:C:\\Users\\leet\\.rustup\\toolchains\\1.80.0-x86_64-pc-windows-msvc\\lib\\rustlib\\etc\\libstd.natvis" "C:\\Users\\leet\\src\\universe\\src-tauri\\target\\release\\build\\tari-universe-953bbde1bdbb7e5f\\out/resource.lib"
  = note: libtari_storage-92e187574ec8b727.rlib(tari_storage-92e187574ec8b727.tari_storage.753e431bccc95967-cgu.3.rcgu.o) : error LNK2001: unresolved external symbol mdb_txn_begin
          libtari_storage-92e187574ec8b727.rlib(tari_storage-92e187574ec8b727.tari_storage.753e431bccc95967-cgu.2.rcgu.o) : error LNK2001: unresolved external symbol mdb_txn_begin
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.3.rcgu.o) : error LNK2001: unresolved external symbol mdb_txn_begin
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2001: unresolved external symbol mdb_txn_begin
          libtari_comms_dht-1f77f3036865e6bf.rlib(tari_comms_dht-1f77f3036865e6bf.tari_comms_dht.52f04d4ac80f6b22-cgu.11.rcgu.o) : error LNK2001: unresolved external symbol mdb_txn_begin
          libtari_comms-247b1a2e28b3d048.rlib(tari_comms-247b1a2e28b3d048.tari_comms.ae4694e38d1b3013-cgu.08.rcgu.o) : error LNK2001: unresolved external symbol mdb_txn_begin
          libtari_comms-247b1a2e28b3d048.rlib(tari_comms-247b1a2e28b3d048.tari_comms.ae4694e38d1b3013-cgu.05.rcgu.o) : error LNK2001: unresolved external symbol mdb_txn_begin
          libtari_storage-92e187574ec8b727.rlib(tari_storage-92e187574ec8b727.tari_storage.753e431bccc95967-cgu.0.rcgu.o) : error LNK2001: unresolved external symbol mdb_txn_begin
          libtari_core-fabae97f0ad0327e.rlib(tari_core-fabae97f0ad0327e.tari_core.9eea15a3067c1eb6-cgu.11.rcgu.o) : error LNK2001: unresolved external symbol mdb_txn_begin
          libtari_core-fabae97f0ad0327e.rlib(tari_core-fabae97f0ad0327e.tari_core.9eea15a3067c1eb6-cgu.12.rcgu.o) : error LNK2001: unresolved external symbol mdb_txn_begin
          libtari_p2p-6becbafa05531c61.rlib(tari_p2p-6becbafa05531c61.tari_p2p.154a081ee8fa65c4-cgu.05.rcgu.o) : error LNK2001: unresolved external symbol mdb_txn_begin
          libtari_p2p-6becbafa05531c61.rlib(tari_p2p-6becbafa05531c61.tari_p2p.154a081ee8fa65c4-cgu.15.rcgu.o) : error LNK2001: unresolved external symbol mdb_txn_begin
          libtari_comms_dht-1f77f3036865e6bf.rlib(tari_comms_dht-1f77f3036865e6bf.tari_comms_dht.52f04d4ac80f6b22-cgu.11.rcgu.o) : error LNK2001: unresolved external symbol mdb_cursor_get
          libtari_comms-247b1a2e28b3d048.rlib(tari_comms-247b1a2e28b3d048.tari_comms.ae4694e38d1b3013-cgu.08.rcgu.o) : error LNK2001: unresolved external symbol mdb_cursor_get
          libtari_core-fabae97f0ad0327e.rlib(tari_core-fabae97f0ad0327e.tari_core.9eea15a3067c1eb6-cgu.12.rcgu.o) : error LNK2001: unresolved external symbol mdb_cursor_get
          libtari_core-fabae97f0ad0327e.rlib(tari_core-fabae97f0ad0327e.tari_core.9eea15a3067c1eb6-cgu.07.rcgu.o) : error LNK2001: unresolved external symbol mdb_cursor_get
          libtari_p2p-6becbafa05531c61.rlib(tari_p2p-6becbafa05531c61.tari_p2p.154a081ee8fa65c4-cgu.15.rcgu.o) : error LNK2001: unresolved external symbol mdb_cursor_get
          libtari_p2p-6becbafa05531c61.rlib(tari_p2p-6becbafa05531c61.tari_p2p.154a081ee8fa65c4-cgu.06.rcgu.o) : error LNK2001: unresolved external symbol mdb_cursor_get
          libtari_core-fabae97f0ad0327e.rlib(tari_core-fabae97f0ad0327e.tari_core.9eea15a3067c1eb6-cgu.07.rcgu.o) : error LNK2019: unresolved external symbol mdb_put referenced in function _ZN9tari_core13chain_storage7lmdb_db4lmdb11lmdb_insert17h1b031bc4444a2b17E
          libtari_p2p-6becbafa05531c61.rlib(tari_p2p-6becbafa05531c61.tari_p2p.154a081ee8fa65c4-cgu.15.rcgu.o) : error LNK2001: unresolved external symbol mdb_put
          libtari_comms_dht-1f77f3036865e6bf.rlib(tari_comms_dht-1f77f3036865e6bf.tari_comms_dht.52f04d4ac80f6b22-cgu.11.rcgu.o) : error LNK2001: unresolved external symbol mdb_put
          libtari_comms-247b1a2e28b3d048.rlib(tari_comms-247b1a2e28b3d048.tari_comms.ae4694e38d1b3013-cgu.08.rcgu.o) : error LNK2001: unresolved external symbol mdb_put
          libtari_core-fabae97f0ad0327e.rlib(tari_core-fabae97f0ad0327e.tari_core.9eea15a3067c1eb6-cgu.07.rcgu.o) : error LNK2019: unresolved external symbol mdb_del referenced in function _ZN9tari_core13chain_storage7lmdb_db4lmdb11lmdb_delete17h015fcbdf007d80a5E
          libtari_core-fabae97f0ad0327e.rlib(tari_core-fabae97f0ad0327e.tari_core.9eea15a3067c1eb6-cgu.07.rcgu.o) : error LNK2019: unresolved external symbol mdb_cursor_del referenced in function _ZN9tari_core13chain_storage7lmdb_db4lmdb30lmdb_delete_keys_starting_with17h03bc0f65708f7472E
          libtari_core-fabae97f0ad0327e.rlib(tari_core-fabae97f0ad0327e.tari_core.9eea15a3067c1eb6-cgu.07.rcgu.o) : error LNK2019: unresolved external symbol mdb_get referenced in function _ZN9tari_core13chain_storage7lmdb_db4lmdb8lmdb_get17h04a61606e15465f8E
          libtari_comms-247b1a2e28b3d048.rlib(tari_comms-247b1a2e28b3d048.tari_comms.ae4694e38d1b3013-cgu.08.rcgu.o) : error LNK2001: unresolved external symbol mdb_get
          libtari_storage-92e187574ec8b727.rlib(tari_storage-92e187574ec8b727.tari_storage.753e431bccc95967-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_dbi_open referenced in function _ZN9lmdb_zero3dbi8Database4open17heb6aede7161421f9E
          libtari_storage-92e187574ec8b727.rlib(tari_storage-92e187574ec8b727.tari_storage.753e431bccc95967-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_set_compare referenced in function _ZN9lmdb_zero3dbi8Database4open17heb6aede7161421f9E
          libtari_storage-92e187574ec8b727.rlib(tari_storage-92e187574ec8b727.tari_storage.753e431bccc95967-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_set_dupsort referenced in function _ZN9lmdb_zero3dbi8Database4open17heb6aede7161421f9E
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.3.rcgu.o) : error LNK2019: unresolved external symbol mdb_cursor_close referenced in function _ZN4core3ptr46drop_in_place$LT$lmdb_zero..cursor..Cursor$GT$17h630f25507a16f9b8E
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.0.rcgu.o) : error LNK2001: unresolved external symbol mdb_cursor_close
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.4.rcgu.o) : error LNK2001: unresolved external symbol mdb_cursor_close
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.3.rcgu.o) : error LNK2019: unresolved external symbol mdb_txn_abort referenced in function _ZN4core3ptr51drop_in_place$LT$lmdb_zero..tx..ReadTransaction$GT$17h3ab0490b8d034356E
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2001: unresolved external symbol mdb_txn_abort
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.0.rcgu.o) : error LNK2001: unresolved external symbol mdb_txn_abort
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.4.rcgu.o) : error LNK2001: unresolved external symbol mdb_txn_abort
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.3.rcgu.o) : error LNK2019: unresolved external symbol mdb_txn_commit referenced in function _ZN9lmdb_zero2tx8TxHandle6commit17h4551721647371f71E
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2001: unresolved external symbol mdb_txn_commit
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.3.rcgu.o) : error LNK2019: unresolved external symbol mdb_txn_id referenced in function _ZN9lmdb_zero2tx16ConstTransaction2id17h07a666e6f9bb6d0fE
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.3.rcgu.o) : error LNK2019: unresolved external symbol mdb_stat referenced in function _ZN9lmdb_zero2tx16ConstTransaction7db_stat17h835d5bdd507d411dE
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.3.rcgu.o) : error LNK2019: unresolved external symbol mdb_dbi_flags referenced in function _ZN9lmdb_zero2tx16ConstTransaction8db_flags17h4b2c638e0c9d941dE
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.3.rcgu.o) : error LNK2019: unresolved external symbol mdb_txn_reset referenced in function _ZN9lmdb_zero2tx15ReadTransaction5reset17h89c924fb10081fcbE
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.3.rcgu.o) : error LNK2019: unresolved external symbol mdb_txn_renew referenced in function _ZN9lmdb_zero2tx16ResetTransaction5renew17h61395c6e9efb464bE
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.3.rcgu.o) : error LNK2019: unresolved external symbol mdb_drop referenced in function _ZN9lmdb_zero2tx13WriteAccessor8clear_db17h192f5c58a656c939E
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2001: unresolved external symbol mdb_drop
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.3.rcgu.o) : error LNK2019: unresolved external symbol mdb_cursor_open referenced in function _ZN9lmdb_zero6cursor6Cursor9construct17hd1a0da3137dcb08aE
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.3.rcgu.o) : error LNK2019: unresolved external symbol mdb_cursor_renew referenced in function _ZN9lmdb_zero6cursor6Cursor10from_stale17h7f21b4fffdae8fffE
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_strerror referenced in function _ZN60_$LT$lmdb_zero..error..Error$u20$as$u20$core..fmt..Debug$GT$3fmt17hc6ea0b23899ea3e5E
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_env_close referenced in function _ZN67_$LT$lmdb_zero..env..EnvHandle$u20$as$u20$core..ops..drop..Drop$GT$4drop17hf26d96612d95af78E
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.0.rcgu.o) : error LNK2001: unresolved external symbol mdb_env_close
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.4.rcgu.o) : error LNK2001: unresolved external symbol mdb_env_close
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_env_create referenced in function _ZN9lmdb_zero3env10EnvBuilder3new17he9f3770e5e75299bE
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_env_set_mapsize referenced in function _ZN9lmdb_zero3env10EnvBuilder11set_mapsize17hb82d92ca5d5b2e0bE
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_env_set_maxreaders referenced in function _ZN9lmdb_zero3env10EnvBuilder14set_maxreaders17hfa8ff669836f57bbE
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_env_set_maxdbs referenced in function _ZN9lmdb_zero3env10EnvBuilder10set_maxdbs17h78520330c2261439E
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_env_open referenced in function _ZN9lmdb_zero3env10EnvBuilder4open17hf1e592e7b665bdefE
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_env_copy2 referenced in function _ZN9lmdb_zero3env11Environment4copy17hfab81958562f3c7cE
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_env_copyfd2 referenced in function _ZN9lmdb_zero3env11Environment6copyfd17h00565b3e8877a0b6E
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_env_stat referenced in function _ZN9lmdb_zero3env11Environment4stat17hd43a8ce7da91f515E
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_env_info referenced in function _ZN9lmdb_zero3env11Environment4info17hfc7c26b3ed4694cbE
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_env_sync referenced in function _ZN9lmdb_zero3env11Environment4sync17h9f96abf725223703E
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_env_set_flags referenced in function _ZN9lmdb_zero3env11Environment9set_flags17h059c7a772aa1e699E
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_env_get_flags referenced in function _ZN9lmdb_zero3env11Environment5flags17h5effd21d24a556c0E
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_env_get_path referenced in function _ZN9lmdb_zero3env11Environment4path17h2a80af2062922be3E
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_env_get_fd referenced in function _ZN9lmdb_zero3env11Environment2fd17h4a662d3e02e0dcf2E
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_env_get_maxreaders referenced in function _ZN9lmdb_zero3env11Environment10maxreaders17h2459577a25e5ddeaE
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_env_get_maxkeysize referenced in function _ZN9lmdb_zero3env11Environment10maxkeysize17h70b24b218e2dbd91E
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_reader_check referenced in function _ZN9lmdb_zero3env11Environment12reader_check17h55d82638e0693694E
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.2.rcgu.o) : error LNK2019: unresolved external symbol mdb_dbi_close referenced in function _ZN9lmdb_zero3env9dbi_close17hd99ca4f625e18219E
          liblmdb_zero-6a0f2bb6df4fa2e1.rlib(lmdb_zero-6a0f2bb6df4fa2e1.lmdb_zero.9dd3ae9e030baf09-cgu.0.rcgu.o) : error LNK2019: unresolved external symbol mdb_version referenced in function _ZN9lmdb_zero11version_str17h1a8a1793ca3850b2E
          C:\Users\leet\src\universe\src-tauri\target\release\deps\libliblmdb_sys-1afe1ef2a8a44721.rlib : warning LNK4272: library machine type 'x86' conflicts with target machine type 'x64'
          C:\Users\leet\src\universe\src-tauri\target\release\deps\tari_universe.exe : fatal error LNK1120: 41 unresolved externals


error: could not compile `tari-universe` (bin "tari-universe") due to 1 previous error
```

# Environment setup solution
Use the ```x64 Native Tools Command Prompt for VS 2022```, that should have been installed and setup when doing the ```Visual Studio``` install. This can be found from the StartMenu -> All apps -> Visual Studio -> x64 Native Tools Command Prompt for VS 2022

This Command Prompt has environment and/or paths setup for the ```Visual Studio Tools```, like cmake, which is needed for ```randomx-rs```

sample output while using ```x64 Native Tools Command Prompt for VS 2022```:
```
**********************************************************************
** Visual Studio 2022 Developer Command Prompt v17.12.0
** Copyright (c) 2022 Microsoft Corporation
**********************************************************************
[vcvarsall.bat] Environment initialized for: 'x64'

C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools>cd C:\Users\leet\src\universe\src-tauri

C:\Users\leet\src\universe\src-tauri>cargo clean
     Removed 7903 files, 2.8GiB total

C:\Users\leet\src\universe\src-tauri>cargo build --release
   Compiling proc-macro2 v1.0.89
   Compiling unicode-ident v1.0.13
   Compiling serde v1.0.214
   Compiling windows_x86_64_msvc v0.52.6
```
sample output:
```
   Compiling sha1 v0.10.6
   Compiling constant_time_eq v0.3.1
   Compiling nvml-wrapper v0.10.0
   Compiling jsonwebtoken v9.3.0
   Compiling auto-launch v0.5.0
   Compiling async_zip v0.0.17
   Compiling tauri-plugin-single-instance v0.0.0 (https://github.com/tauri-apps/plugins-workspace?branch=v1#0a8484c5)
   Compiling sentry-tauri v0.3.1
   Compiling sanitize-filename v0.5.0
   Compiling keyring v3.6.1
   Compiling open v5.3.0
   Compiling human_format v1.1.0
   Compiling dyn-clone v1.0.17
   Compiling minotari_node_grpc_client v0.1.0 (https://github.com/tari-project/tari.git?branch=development#e61b5e2d)
   Compiling minotari_wallet_grpc_client v0.1.0 (https://github.com/tari-project/tari.git?branch=development#e61b5e2d)
   Compiling sysinfo v0.31.4
    Finished `release` profile [optimized] target(s) in 8m 36s
```