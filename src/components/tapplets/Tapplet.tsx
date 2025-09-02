import { forwardRef, useCallback, useEffect, useRef } from 'react';
import { useTappletSignerStore } from '@app/store/useTappletSignerStore';
import { TappletContainer } from '@app/containers/main/Dashboard/MiningView/MiningView.styles';
import { open } from '@tauri-apps/plugin-shell';
import { useConfigUIStore, useUIStore, setError as setStoreError } from '@app/store';
import { IframeMessage, isInterTappletMessage, MessageType, useIframeMessage } from '@app/hooks/swap/useIframeMessage';
import { invoke } from '@tauri-apps/api/core';
import React from 'react';
import { useTappletsStore } from '@app/store/useTappletsStore';
import { RunningTapplet } from '@app/types/tapplets/tapplet.types';

interface TappletProps {
    tapplet: RunningTapplet;
    iframeRefs: React.RefObject<Record<number, HTMLIFrameElement | null>>;
}

export const Tapplet = forwardRef<HTMLIFrameElement, TappletProps>(({ tapplet, iframeRefs }, forwardedRef) => {
    const tappletRef = useRef<HTMLIFrameElement | null>(null);
    const tappSigner = useTappletSignerStore((s) => s.tappletSigner);
    const runTransaction = useTappletSignerStore((s) => s.runTransaction);
    const runBridgeTransaction = useTappletSignerStore((s) => s.runBridgeTransaction);
    const language = useConfigUIStore((s) => s.application_language);
    const theme = useUIStore((s) => s.theme);
    const activeTapplet = useTappletsStore((s) => s.activeTapplet);
    const disabled = tapplet.tapplet_id !== activeTapplet?.tapplet_id;
    const showTapplet = useUIStore((s) => s.showTapplet);
    console.warn(`💸 SHOW TAPPLET :`, showTapplet, activeTapplet?.display_name, tapplet.display_name, disabled);

    const setRefs = useCallback(
        (node: HTMLIFrameElement | null) => {
            tappletRef.current = node;

            if (typeof forwardedRef === 'function') {
                forwardedRef(node);
            } else if (forwardedRef) {
                forwardedRef.current = node;
            }
        },
        [forwardedRef]
    );

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
            console.error('[Tapplet] Provided external URL is invalid or missing:', url);
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

    const runBridgeTx = useCallback(
        async (event: MessageEvent) => {
            await runBridgeTransaction(event);
        },
        [runBridgeTransaction]
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

    const sendInterTappResponse = useCallback(
        (event: MessageEvent<IframeMessage>) => {
            if (!isInterTappletMessage(event.data)) return;
            const { targetTappletRegistryId, sourceTappletRegistryId } = event.data.payload;
            // check if the message is for this tapplet; if not just skip
            if (targetTappletRegistryId !== tapplet.package_name) return;

            if (tapplet.allowReceiveFrom && !tapplet.allowReceiveFrom.includes(sourceTappletRegistryId)) {
                console.error(
                    `[Tapplet ${tapplet.display_name}] Message rejected: sender tapplet "${sourceTappletRegistryId}" is not allowed in allowReceiveFrom.`
                );
                return;
            }
            if (tapplet.allowSendTo && !tapplet.allowSendTo.includes(sourceTappletRegistryId)) {
                console.error(
                    `[Tapplet ${tapplet.display_name}] Message rejected: receiver tapplet "${sourceTappletRegistryId}" is not allowed in allowSendTo.`
                );
                return;
            }
            const targetIframe = Object.values(iframeRefs.current || {}).find(
                (iframe) => iframe?.getAttribute('title') === targetTappletRegistryId
            );

            if (!targetIframe?.contentWindow) {
                console.error(
                    `[Tapplet] Unable to send inter-tapplet message: target iframe with title "${targetTappletRegistryId}" not found or has no contentWindow.`
                );
                return;
            }

            try {
                targetIframe.contentWindow.postMessage(event.data, '*');
            } catch (error) {
                console.error('[Tapplet] Failed to post inter-tapplet message:', error);
            }
        },
        [iframeRefs, tapplet]
    );

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
            case MessageType.BRIDGE_CALL:
                console.warn('[TAPPLET] handle iframe msg type bridge call:', event.data.type);
                runBridgeTx(event);
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
            case MessageType.INTER_TAPPLET: {
                console.info('[TAPPLET] handle inter-tapplet message:', event.data.type);
                sendInterTappResponse(event);
                break;
            }
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
    useEffect(() => {
        const messageHandler = (event: MessageEvent) => {
            if (event.data.type !== undefined) {
                console.warn('🗫[tapp listener] Message received:', event.data);
            }
        };

        window.addEventListener('message', messageHandler);

        return () => {
            window.removeEventListener('message', messageHandler);
        };
    }, []);

    return (
        <TappletContainer>
            <iframe
                ref={setRefs}
                title={tapplet.package_name}
                src={tapplet.source}
                width="100%"
                height="100%"
                onLoad={() => {
                    if (tappletRef.current) {
                        sendWindowSize();
                    }
                }}
                style={{ border: 'none', pointerEvents: 'all', display: disabled ? 'none' : 'block' }}
            />
        </TappletContainer>
    );
});

Tapplet.displayName = 'Tapplet';
