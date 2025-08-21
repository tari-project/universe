import { useCallback, useEffect, useRef } from 'react';
import { useTappletSignerStore } from '@app/store/useTappletSignerStore';
import { TappletContainer } from '@app/containers/main/Dashboard/MiningView/MiningView.styles';
import { open } from '@tauri-apps/plugin-shell';
import { useConfigUIStore, useUIStore, setError as setStoreError } from '@app/store';
import { MessageType, useIframeMessage } from '@app/hooks/swap/useIframeMessage';
import { invoke } from '@tauri-apps/api/core';

interface TappletProps {
    activeTappId: number;
    source: string;
}

export const Tapplet: React.FC<TappletProps> = ({ activeTappId, source }) => {
    const tappletRef = useRef<HTMLIFrameElement | null>(null);
    const tappSigner = useTappletSignerStore((s) => s.tappletSigner);
    const runTransaction = useTappletSignerStore((s) => s.runTransaction);
    const language = useConfigUIStore((s) => s.application_language);
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

    const openExternalLink = useCallback(async (url: string) => {
        if (!url || typeof url !== 'string') {
            console.error('Invalid external tapplet URL');
        }
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
                { type: MessageType.SET_LANGUAGE, payload: { language } },
                '*'
            );
        }
    }, [language]);

    const sendTheme = useCallback(() => {
        if (tappletRef.current) {
            tappletRef.current.contentWindow?.postMessage({ type: MessageType.SET_THEME, payload: { theme } }, '*');
        }
    }, [theme]);

    const emitNotification = useCallback(async (msg: string) => {
        try {
            const isAccepted = await invoke('emit_tapplet_notification', { receiverTappId: 2, notification: msg });
            // TODO proceed with notification eg open abother tapp
            // if (isAccepted) setActiveTappById(1, false, true);
            console.info('[TAPPLET] notification accept?', isAccepted);
        } catch (e) {
            setStoreError(`Tapplet's notification error: ${e}`, true);
        }
    }, []);

    useIframeMessage((event) => {
        switch (event.data.type) {
            case MessageType.GET_PARENT_SIZE:
                console.info('[TAPPLET] handle iframe msg type parent size:', event.data.type);
                sendWindowSize();
                break;
            case MessageType.GET_INIT_CONFIG:
                console.info('[TAPPLET] handle iframe msg type get config:', event.data.type);
                sendAppLanguage();
                sendTheme();
                break;
            case MessageType.SIGNER_CALL:
                console.warn('[TAPPLET] handle iframe msg type signer call:', event.data.type);
                runTappletTx(event);
                break;
            case MessageType.OPEN_EXTERNAL_LINK: {
                console.info('[TAPPLET] handle iframe msg type ext link:', event.data.type);

                const url = event.data.payload.url;
                try {
                    const { hostname } = new URL(url);
                    console.info('[TAPPLET] url ', url);
                    console.info('[TAPPLET] hos ', hostname);
                    openExternalLink(url);
                } catch {
                    setStoreError(`Invalid URL: ${url}`, true);
                }
                break;
            }
            case MessageType.NOTIFICATION: {
                console.info('[TAPPLET] handle notification:', event.data.payload.notification);
                emitNotification(event.data.payload.notification);
                break;
            }
            case MessageType.ERROR:
                console.info('[TAPPLET] handle iframe msg type error:', event.data.type);
                setStoreError(`${event.data.payload.message}`, true);
                break;
            default:
                // Ignore unknown types
                break;
        }
    });

    useEffect(() => {
        sendAppLanguage();
    }, [sendAppLanguage]);

    useEffect(() => {
        sendTheme();
    }, [sendTheme]);

    useEffect(() => {
        window.addEventListener('resize', sendWindowSize);
        sendWindowSize();

        return () => {
            window.removeEventListener('resize', sendWindowSize);
        };
    }, [sendWindowSize]);

    return (
        <TappletContainer>
            <iframe
                key={activeTappId}
                src={source}
                width="100%"
                height="100%"
                onLoad={sendWindowSize}
                style={{ border: 'none', pointerEvents: 'all' }}
                sandbox="allow-same-origin allow-popups allow-scripts"
            />
        </TappletContainer>
    );
};
