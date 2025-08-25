import { forwardRef, useCallback, useEffect, useRef } from 'react';
import { useTappletSignerStore } from '@app/store/useTappletSignerStore';
import { TappletContainer } from '@app/containers/main/Dashboard/MiningView/MiningView.styles';
import { open } from '@tauri-apps/plugin-shell';
import { useConfigUIStore, useUIStore, setError as setStoreError } from '@app/store';
import { MessageType, useIframeMessage } from '@app/hooks/swap/useIframeMessage';
import { invoke } from '@tauri-apps/api/core';
import React from 'react';

interface TappletProps {
    activeTappId: number;
    source: string;
    tappletId: number;
    disabled?: boolean;
}

export const Tapplet = forwardRef<HTMLIFrameElement, TappletProps>(
    ({ activeTappId, tappletId, source, disabled = false }, ref) => {
        const tappletRef = useRef<HTMLIFrameElement | null>(null);
        const iframeRef = (ref as React.RefObject<HTMLIFrameElement | null>) || tappletRef;
        const tappSigner = useTappletSignerStore((s) => s.tappletSigner);
        const runTransaction = useTappletSignerStore((s) => s.runTransaction);
        const language = useConfigUIStore((s) => s.application_language);
        const theme = useUIStore((s) => s.theme);

        // // Compute allowedOrigins map from dynamic store data
        // const allowedOrigins: Record<number, string> = {};
        // inUseTapp.forEach((tapplet) => {
        //     try {
        //         const origin = new URL(tapplet.source).origin;
        //         allowedOrigins[tapplet.tapplet_id] = origin;
        //     } catch {
        //         // ignore invalid URLs
        //     }
        // });

        // Extract trusted origin from source URL
        const trustedOrigin = (() => {
            try {
                const originSource = new URL(source).origin;
                console.info('🗫🗫🗫 SOURCE ORIGIN', originSource);
                return originSource;
            } catch {
                return '';
            }
        })();

        // Listen for messages from the parent relay targeted to this tapplet
        useEffect(() => {
            function onMessage(event: MessageEvent) {
                // Check origin matches trustedOrigin (sender is parent window)
                if (event.origin !== trustedOrigin) return;

                const { fromTappletId, payload } = event.data || {};

                // Check that message is from a known tapplet id (eg. 1 if this is 3)
                if (typeof fromTappletId !== 'number') return;

                // Only accept messages from allowed tapplet origins (implement your logic here)
                // For example, allow only from tappletId = 1 if this is 3
                // const allowedOrigins: Record<number, string> = {
                //     1: 'http://localhost:3001', // A's known origin
                //     3: 'http://localhost:3003', // B's origin - adjust accordingly
                // };

                // if (!(fromTappletId in allowedOrigins)) {
                //     console.error('origin not allowed: unknown fromTappletId', fromTappletId);
                //     return;
                // }

                // if (trustedOrigin !== allowedOrigins[fromTappletId]) {
                //     console.error('origin not allowed: mismatched origin for fromTappletId', fromTappletId);
                //     return;
                // }

                // Log the message received from allowed origin
                console.info(`[Tapplet ${tappletId}] message from tapplet ${fromTappletId}:`, payload);
            }

            window.addEventListener('message', onMessage);
            return () => window.removeEventListener('message', onMessage);
        }, [trustedOrigin, tappletId]);

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
            // const data = event.data as any;

            // // Basic validity check: data must exist and be an object
            // if (!data || typeof data !== 'object' || event.data.type === undefined) return;

            // // Now safely extract fields with optional chaining and typeof checks
            // const toTappletId = typeof data.toTappletId === 'number' ? data.toTappletId : undefined;
            // const fromTappletId = typeof data.fromTappletId === 'number' ? data.fromTappletId : undefined;
            // const payload = data.payload;
            // const type = data.type;
            // console.info('[TAPPLET] handle iframe msg', event.data.type);
            // // Only process messages explicitly targeted to this tapplet
            // if (toTappletId !== tappletId) return;

            // // Map allowed senders for current tapplet, example:
            // const allowedSenders: Record<number, number[]> = {
            //     1: [3], // tapplet 1 only accepts from tapplet 3
            //     3: [1], // tapplet 3 only accepts from tapplet 1
            // };

            // // Validate sender is allowed
            // if (!fromTappletId || !allowedSenders[tappletId]?.includes(fromTappletId)) {
            //     console.error(`[Tapplet ${tappletId}] Disallowed sender: ${fromTappletId}`);
            //     return;
            // }
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
                    console.info('[TAPPLET] handle iframe msg INTER TAPP:', event.data.type);
                    const { targetTappletId } = event.data.payload;
                    console.info('[TAPPLET] id', tappletId, targetTappletId);

                    // Process only messages targeted to this tapplet
                    if (targetTappletId !== tappletId) return;

                    // Map allowed sender tapplet IDs for this tapplet
                    const allowedSenders: Record<number, number[]> = {
                        1: [3], // tapplet 1 accepts only from tapplet 3
                        3: [1], // tapplet 3 accepts only from tapplet 1 (example)
                        // extend as needed
                    };

                    if (!allowedSenders[tappletId]?.includes(3)) {
                        console.error(`[Tapplet ${tappletId}] Disallowed sender tapplet ${3}`);
                        return;
                    }
                    console.info('🏝️🏝️🏝️ [TAPPLET] tappletRef', tappletRef);
                    console.info('🏝️🏝️🏝️ [TAPPLET] iframeRef', iframeRef);
                    console.info('🏝️🏝️🏝️ [TAPPLET] handle INTER_TAPPLET:', event.data.payload.msg);
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

        return (
            <TappletContainer>
                <iframe
                    ref={iframeRef}
                    src={source}
                    width="100%"
                    height="100%"
                    onLoad={sendWindowSize}
                    style={{ border: 'none', pointerEvents: 'all', display: disabled ? 'none' : 'block' }}
                    sandbox="allow-same-origin allow-popups allow-scripts"
                />
            </TappletContainer>
        );
    }
);

Tapplet.displayName = 'Tapplet';
