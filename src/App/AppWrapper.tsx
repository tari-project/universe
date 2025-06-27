import { preload } from 'react-dom';

import AppEffects from './AppEffects.tsx';
import App from './App.tsx';

export const URL_BLOCK_SOLVED = `https://customer-o6ocjyfui1ltpm5h.cloudflarestream.com/852dac0dc91d50d399a7349dcc7316a1/manifest/video.m3u8`;
export const URL_BLOCK = `https://customer-o6ocjyfui1ltpm5h.cloudflarestream.com/3ed05f3d4fbfd3eec7c4bb911915d1c2/manifest/video.m3u8`;
export const URL_SYNC = `https://customer-o6ocjyfui1ltpm5h.cloudflarestream.com/d15edd1d0a5a2452a49f1312312b69f0/manifest/video.m3u8`;
export const URL_SYNC_DARK = `https://customer-o6ocjyfui1ltpm5h.cloudflarestream.com/af0c72594da95f7507ccca86831c4c0b/manifest/video.m3u8`;

export default function AppWrapper() {
    preload(URL_BLOCK, { as: 'video' });
    preload(URL_BLOCK_SOLVED, { as: 'video' });
    preload(URL_SYNC, { as: 'video' });
    preload(URL_SYNC_DARK, { as: 'video' });
    return (
        <>
            <AppEffects />
            <App />
        </>
    );
}
