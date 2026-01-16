import { useCallback, useEffect, useRef } from 'react';
import { open } from '@tauri-apps/plugin-shell';
import { useConfigUIStore, useUIStore, setError as setStoreError } from '@app/store';
import { TappletContainer } from '@app/containers/main/Dashboard/MiningView/MiningView.styles';
import { runTappletTransaction } from '@app/store/useTappletSignerStore.ts';

interface TappletProps {
    source: string;
}

export const Tapplet = ({ source }: TappletProps) => {
    const tappletRef = useRef<HTMLIFrameElement | null>(null);
    const appLanguage = useConfigUIStore((s) => s.application_language);
    const theme = useUIStore((s) => s.theme);

    const openExternalLink = useCallback(async (event: MessageEvent) => {
        if (!event.data.url || typeof event.data.url !== 'string') {
            console.error('Invalid external tapplet URL');
        }
        const url = event.data?.url;
        console.info('Opening external tapplet URL:', url);
        try {
            await open(url);
        } catch (e) {
            setStoreError(`Open tapplet URL error: ${e}`, true);
        }
    }, []);

    const sendAppLanguage = useCallback(() => {
        if (tappletRef.current) {
            tappletRef.current.contentWindow?.postMessage(
                { type: 'SET_LANGUAGE', payload: { language: appLanguage } },
                '*'
            );
        }
    }, [appLanguage]);

    const sendTheme = useCallback(() => {
        if (tappletRef.current) {
            tappletRef.current.contentWindow?.postMessage({ type: 'SET_THEME', payload: { theme } }, '*');
        }
    }, [theme]);

    const handleMessage = useCallback(
        async (event: MessageEvent) => {
            switch (event.data.type) {
                case 'signer-call':
                    await runTappletTransaction(event);
                    break;
                case 'open-external-link':
                    await openExternalLink(event);
                    break;
                case 'GET_INIT_CONFIG': {
                    sendAppLanguage();
                    sendTheme();
                    break;
                }
                case 'ERROR':
                    setStoreError(`${event.data.payload.message}`, true);
                    break;
            }
        },
        [openExternalLink, sendAppLanguage, sendTheme]
    );

    useEffect(() => {
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [handleMessage]);

    return (
        <TappletContainer>
            <iframe
                src={source}
                width="100%"
                height="100%"
                ref={tappletRef}
                style={{ border: 'none', pointerEvents: 'all', width: '100%', height: '100%' }}
            />
        </TappletContainer>
    );
};
