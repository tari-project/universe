import { preload } from 'react-dom';

import AppEffects from './AppEffects.tsx';
import App from './App.tsx';

export const URL_BLOCK_SOLVED = `https://customer-o6ocjyfui1ltpm5h.cloudflarestream.com/852dac0dc91d50d399a7349dcc7316a1/manifest/video.m3u8`;
export const URL_BLOCK = `https://customer-o6ocjyfui1ltpm5h.cloudflarestream.com/3ed05f3d4fbfd3eec7c4bb911915d1c2/manifest/video.m3u8`;

export default function AppWrapper() {
    preload(URL_BLOCK, { as: 'video' });
    preload(URL_BLOCK_SOLVED, { as: 'video' });
    return (
        <>
            <AppEffects />
            <App />
        </>
    );
}
