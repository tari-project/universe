# Video assets with transparency | Convert from `.webm`

---

### Context

The issue was first noted when we got a new loading state video in `.webm` format. The transparent background rendered as an opaque black background on macOS (☹).
Safari supports `.webm`, but **not** with alpha.

<details open><summary style="font-weight: bold; font-style: italic">TL:DR from a video converter app's blog:</summary>

[the blog post](https://rotato.app/blog/transparent-videos-for-the-web)

> - Safari supports **HEVC** with alpha, and Chrome does not.
> - Chrome supports **VP9** with alpha, and Safari does not.

...

> As of Safari 15 in macOS Big Sur, Safari has VP9/webm support. **But not for transparency.**

</details>

---

## Solution

1. If you get the asset in `.webm` format, convert to `.mov` (using **hevc** !!)
2. Check the OS and use the relevant src. Example in `src/containers/main/Sync/Sync.tsx`

### Step 1 detailed:

a) Convert the video. 

### Step 2 detailed:

```tsx
import { type } from '@tauri-apps/plugin-os';

const isMac = type() === 'macos';
const videoSrc = `/assets/video/coin_loader.${isMac ? 'mov' : 'webm'}`;
```

---

#### Relevent links

- https://rotato.app/blog/transparent-videos-for-the-web
- https://supergeekery.com/blog/transparent-video-in-chrome-edge-firefox-and-safari-circa-2022
- https://developer.apple.com/forums/thread/768097
- https://css-tricks.com/overlaying-video-with-transparency-while-wrangling-cross-browser-support/
- https://developer.apple.com/documentation/AVFoundation/using-hevc-video-with-alpha
- https://developer.apple.com/documentation/safari-release-notes/safari-17_4-release-notes
- https://discussions.apple.com/thread/253025458?sortBy=rank
- https://forum.babylonjs.com/t/transparent-video/47736/2
