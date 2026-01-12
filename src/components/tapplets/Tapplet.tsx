import { useCallback, useEffect, useEffectEvent, useRef } from 'react';
import { runTransaction, useTappletSignerStore } from '@app/store/useTappletSignerStore';
import { StyledIFrame, TappletContainer } from '@app/containers/main/Dashboard/MiningView/MiningView.styles';
import { open } from '@tauri-apps/plugin-shell';
import { useConfigUIStore, useUIStore, setError as setStoreError, useAirdropStore } from '@app/store';
import { FEATURE_FLAGS } from '@app/store/consts.ts';
import { IframeMessage, MessageType } from '@app/types/tapplets/tapplet.types.ts';

interface TappletProps {
    source: string; //port
}

const ORIGIN = 'http://127.0.0.1';
export const Tapplet = ({ source }: TappletProps) => {
    const tappletRef = useRef<HTMLIFrameElement | null>(null);
    const tappSigner = useTappletSignerStore((s) => s.tappletSigner);
    const appLanguage = useConfigUIStore((s) => s.application_language);
    const theme = useUIStore((s) => s.theme);
    const features = useAirdropStore((s) => s.features);

    function sendMessage(message: IframeMessage) {
        const parsedMsg = JSON.stringify(message, null, 2);
        if (tappletRef?.current?.contentWindow) {
            tappletRef.current.contentWindow.postMessage(parsedMsg, `${ORIGIN}:*`);
        }
    }

    const sendWindowSize = useCallback(() => {
        if (tappletRef?.current) {
            const height = tappletRef.current.offsetHeight;
            const width = tappletRef.current.offsetWidth;
            const tappletWindow = tappletRef.current.contentWindow;

            tappSigner?.setWindowSize(width, height);
            tappSigner?.sendWindowSizeMessage(tappletWindow, `${ORIGIN}:*`);
        }
    }, [tappSigner]);

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

    const sendFeatures = useCallback(() => {
        const unwrapFeature = !!features?.includes(FEATURE_FLAGS.FE_UNWRAP);
        sendMessage({ type: MessageType.SET_FEATURES, payload: { unwrapEnabled: unwrapFeature } });
    }, [features]);

    const sendTheme = useCallback(() => sendMessage({ type: MessageType.SET_THEME, payload: { theme } }), [theme]);

    const onResize = useEffectEvent(() => {
        sendWindowSize();
    });

    const onMessageEvent = useEffectEvent(async (e: MessageEvent) => {
        console.log('INCOMING onMessageEvent', e.data);
        switch (e.data.type) {
            case 'request-parent-size':
                sendWindowSize();
                break;
            case 'signer-call':
                await runTappletTx(e);
                break;
            case 'open-external-link':
                await openExternalLink(e);
                break;
            case 'GET_INIT_CONFIG': {
                sendAppLanguage();
                sendTheme();
                sendFeatures();
                break;
            }
            case 'ERROR':
                setStoreError(`${e.data.payload.message}`, true);
                break;
        }
    });

    useEffect(() => {
        window.addEventListener('message', onMessageEvent);
        return () => window.removeEventListener('message', onMessageEvent);
    }, []);
    useEffect(() => {
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    return (
        <TappletContainer>
            <StyledIFrame
                src={`${ORIGIN}:${source}`}
                ref={tappletRef}
                sandbox="allow-same-origin allow-modals allow-forms allow-scripts"
            />
        </TappletContainer>
    );
};
