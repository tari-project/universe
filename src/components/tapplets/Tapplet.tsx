import { forwardRef, useCallback, useEffect, useRef } from 'react';
import { useTappletSignerStore } from '@app/store/useTappletSignerStore';
import { TappletContainer } from '@app/containers/main/Dashboard/MiningView/MiningView.styles';
import { open } from '@tauri-apps/plugin-shell';
import { useConfigUIStore, useUIStore, setError as setStoreError } from '@app/store';
import { IframeMessage, MessageType, useIframeMessage } from '@app/hooks/swap/useIframeMessage';
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
    // const iframeRef = (ref as React.RefObject<HTMLIFrameElement | null>) || tappletRef;
    // Use a callback ref to assign both forwardedRef and local tappletRef
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

    console.warn('REFS', tapplet.display_name, tappletRef);
    const tappSigner = useTappletSignerStore((s) => s.tappletSigner);
    const runTransaction = useTappletSignerStore((s) => s.runTransaction);
    const language = useConfigUIStore((s) => s.application_language);
    const theme = useUIStore((s) => s.theme);
    const activeTapplet = useTappletsStore((s) => s.activeTapplet);
    const disabled = tapplet.tapplet_id !== activeTapplet?.tapplet_id;

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

    const sendInterTappResponse = useCallback(
        (event: MessageEvent<IframeMessage>, targetTappletId: string) => {
            const targetIframe = Object.values(iframeRefs.current || {}).find(
                (iframe) => iframe?.getAttribute('src') === event.origin
            );

            if (!targetIframe?.contentWindow) {
                return;
            }

            try {
                const message = {
                    type: MessageType.INTER_TAPPLET,
                    payload: {
                        sourceTappletRegistryId: tapplet.package_name,
                        targetTappletRegistryId: targetTappletId,
                        msg: 'RESPONSE MESSAGE', // TODO Forward the original message
                    },
                };

                targetIframe.contentWindow.postMessage(message, targetIframe.src);
                console.info('📝 [TAPPLET] Message sent:', {
                    from: tapplet.package_name,
                    to: targetTappletId,
                    message,
                });
            } catch (error) {
                console.error('📝 [TAPPLET] Failed to send message:', error);
            }
        },
        [tapplet.package_name, iframeRefs]
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
                console.info(
                    '🗫[TAPPLET] handle iframe msg INTER TAPP with msg:',
                    event.data.type,
                    event.data.payload.msg
                );
                const { targetTappletRegistryId, sourceTappletRegistryId } = event.data.payload;
                console.info(
                    '🗫 [TAPPLET] id (this, source, target)',
                    tapplet.tapplet_id,
                    sourceTappletRegistryId,
                    targetTappletRegistryId
                );

                // Process only messages targeted to this tapplet
                //TODO get currect tapplet registry
                console.info('[TAPPLET] ', tapplet);
                if (targetTappletRegistryId !== tapplet.package_name) return;
                //TODO TEMP CHECK
                if (tapplet.allowReceiveFrom && !tapplet.allowReceiveFrom.includes(sourceTappletRegistryId)) {
                    console.error(
                        `[Tapplet ${tapplet.display_name}] Disallowed sender tapplet ${sourceTappletRegistryId}`
                    );
                    return;
                }
                console.info('🏝️🏝️🏝️ [TAPPLET] tapplet current', tapplet.package_name);
                console.info('🏝️🏝️🏝️ [TAPPLET] iframeRef', tappletRef.current);
                if (tapplet.allowSendTo && !tapplet.allowSendTo.includes(sourceTappletRegistryId)) {
                    console.error(
                        `[Tapplet ${tapplet.display_name}] Disallowed receiver tapplet ${sourceTappletRegistryId}`
                    );
                    return;
                }
                sendInterTappResponse(event, sourceTappletRegistryId);
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

    useEffect(() => {
        console.info('🔍 [TAPPLET] Mounted:', {
            packageName: tapplet.package_name,
            iframeRefs: iframeRefs.current,
        });
    }, [iframeRefs, tapplet.package_name]);

    return (
        <TappletContainer>
            <iframe
                ref={setRefs}
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
