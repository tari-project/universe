import { useCallback, useEffect, useRef } from 'react';
import { useTappletSignerStore } from '@app/store/useTappletSignerStore';
import { TappletContainer } from '@app/containers/main/Dashboard/MiningView/MiningView.styles';
import { open } from '@tauri-apps/plugin-shell';
import { useConfigUIStore, useUIStore, setError as setStoreError } from '@app/store';

interface TappletProps {
    source: string;
}

export const Tapplet: React.FC<TappletProps> = ({ source }) => {
    const tappletRef = useRef<HTMLIFrameElement | null>(null);
    const tappSigner = useTappletSignerStore((s) => s.tappletSigner);
    const runTransaction = useTappletSignerStore((s) => s.runTransaction);
    const appLanguage = useConfigUIStore((s) => s.application_language);
    const theme = useUIStore((s) => s.theme);

    const sendWindowSize = useCallback(() => {
        if (tappletRef.current) {
            const height = tappletRef.current.offsetHeight;
            const width = tappletRef.current.offsetWidth;
            const tappletWindow = tappletRef.current.contentWindow;
            // use "*" for targetOrigin to bypass strict origin checks for custom protocols
            const targetOrigin = '*';

            tappSigner?.setWindowSize(width, height);
            tappSigner?.sendWindowSizeMessage(tappletWindow, targetOrigin);
        }
    }, [tappSigner]);

    const openExternalLink = useCallback(async (event: MessageEvent) => {
        if (!event.data.url || typeof event.data.url !== 'string') {
            console.error('Invalid external tapplet URL');
        }
        const url = event.data.url;
        console.info('Opening external tapplet URL:', url);
        try {
            await open(url);
        } catch (e) {
            setStoreError(`Open tapplet URL error: ${e}`, true);
        }
    }, []);

    const runTappletTx = useCallback(
        async (event: MessageEvent) => {
            await runTransaction(event);
        },
        [runTransaction]
    );

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
        (event: MessageEvent) => {
            if (event.data.type === 'request-parent-size') {
                sendWindowSize();
            } else if (event.data.type === 'signer-call') {
                runTappletTx(event);
            } else if (event.data.type === 'open-external-link') {
                openExternalLink(event);
            } else if (event.data.type === 'GET_INIT_CONFIG') {
                sendAppLanguage();
                sendTheme();
            } else if (event.data.type === 'ERROR') {
                setStoreError(`${event.data.payload.message}`, true);
            }
        },
        [sendWindowSize, runTappletTx, openExternalLink, sendAppLanguage, sendTheme]
    );

    useEffect(() => {
        sendAppLanguage();
    }, [sendAppLanguage]);

    useEffect(() => {
        sendTheme();
    }, [sendTheme]);

    useEffect(() => {
        window.addEventListener('resize', sendWindowSize);
        window.addEventListener('message', handleMessage);

        sendWindowSize();

        return () => {
            window.removeEventListener('resize', sendWindowSize);
            window.removeEventListener('message', handleMessage);
        };
    }, [sendWindowSize, handleMessage]);

    return (
        <TappletContainer>
            <iframe
                src={source}
                width="100%"
                height="100%"
                ref={tappletRef}
                onLoad={sendWindowSize}
                style={{ border: 'none', pointerEvents: 'all' }}
            />
        </TappletContainer>
    );
};
