# Important notes re. `tauri.conf.json`

---

## Security x CSP considerations

### Tower Animation

Because the [`@tari-project/tari-tower`](https://www.npmjs.com/package/@tari-project/tari-tower) package inlines its assets and has three.js x WebGL scripts, we need CSP sources for it.

- `worker-src` enables dynamic script loading
- `blob:`, `'application/octet-stream'`, and `base64:` sources allow inlined textures and models
- `script-src` and `script-src-elem`

---

### WS connections

- `connect-src` allows secure socket communication
- `wss://ut.tari.com` specific endpoint for airdrop ws

---

### Using [`styled-components`](https://styled-components.com)

`styled-components` has no static export, so we need CSP sources to use it - [relevant issue conversation in Tauri repo](https://github.com/tauri-apps/tauri/discussions/8578#discussioncomment-8131586)

- `'unsafe-inline'` in `style-src`
- `dangerousDisableAssetCspModification` for style injection

### Twitter Profile images

because we added `img-src` for images (to handle the animation's inlined assets) we need to add a source for twitter (didn't want to leave it open-ended for just any images)

- `https://*.twimg.com` - Twitter profile picture domain

### Others worth noting i.e. don't remove

- `'self'` - Local application connections
- `tauri:` and `ipc:` - Internal Tauri and inter-process communication
