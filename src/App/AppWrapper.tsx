import { preload } from 'react-dom';

import AppEffects from './AppEffects.tsx';
import App from './App.tsx';

export const URL_SYNC = `https://customer-o6ocjyfui1ltpm5h.cloudflarestream.com/d15edd1d0a5a2452a49f1312312b69f0/manifest/video.m3u8`;
export const URL_SYNC_DARK = `https://customer-o6ocjyfui1ltpm5h.cloudflarestream.com/af0c72594da95f7507ccca86831c4c0b/manifest/video.m3u8`;

export default function AppWrapper() {
    preload(URL_SYNC, { as: 'video' });
    preload(URL_SYNC_DARK, { as: 'video' });
    return (
        <>
            <AppEffects />
            <App />
        </>
    );
}
