import { useCallback, useEffect, useEffectEvent, useRef } from 'react';
import { runTransaction } from '@app/store/useTappletSignerStore';
import { TappletContainer } from '@app/containers/main/Dashboard/MiningView/MiningView.styles';
import { open } from '@tauri-apps/plugin-shell';
import { useConfigUIStore, useUIStore, setError as setStoreError } from '@app/store';

import { IframeMessage, MessageType } from '@app/types/tapplets/tapplet.types.ts';

interface TappletProps {
    source: string; //port
}

const ORIGIN = 'http://127.0.0.1';
export const Tapplet = ({ source }: TappletProps) => {
    const tappletRef = useRef<HTMLIFrameElement | null>(null);
    const appLanguage = useConfigUIStore((s) => s.application_language);
    const theme = useUIStore((s) => s.theme);

    function sendMessage(message: IframeMessage) {
        if (tappletRef?.current?.contentWindow) {
            tappletRef.current.contentWindow.postMessage(message, `${ORIGIN}:*`);
        }
    }

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

    const runTappletTx = useCallback(async (event: MessageEvent) => await runTransaction(event), []);

    const sendAppLanguage = useCallback(() => {
        if (appLanguage) {
            sendMessage({ type: MessageType.SET_LANGUAGE, payload: { language: appLanguage } });
        }
    }, [appLanguage]);

    const sendTheme = useCallback(() => sendMessage({ type: MessageType.SET_THEME, payload: { theme } }), [theme]);

    const onMessageEvent = useEffectEvent(async (e: MessageEvent) => {
        console.log(e.data);
        switch (e.data.type) {
            case 'signer-call':
                await runTappletTx(e);
                break;
            case 'open-external-link':
                await openExternalLink(e);
                break;
            case 'GET_INIT_CONFIG': {
                sendAppLanguage();
                sendTheme();
                break;
            }
            case 'ERROR':
                setStoreError(`${e.data.payload.message}`, true);
                break;
        }
    });

    useEffect(() => {
        window.addEventListener('message', onMessageEvent);
        return () => {
            window.removeEventListener('message', onMessageEvent);
        };
    }, []);

    return (
        <TappletContainer>
            <iframe
                ref={tappletRef}
                src={source}
                title="Tari Bridge Tapplet"
                loading="lazy"
                width="100%"
                height="100%"
            />
        </TappletContainer>
    );
};
