/* eslint-disable i18next/no-literal-string */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTappletSignerStore } from '@app/store/useTappletSignerStore';
import { TappletContainer } from '@app/containers/main/Dashboard/MiningView/MiningView.styles';
import { open } from '@tauri-apps/plugin-shell';
import { useConfigUIStore, useUIStore, setError as setStoreError } from '@app/store';
import { MessageType, useIframeMessage } from '@app/hooks/swap/useIframeMessage';

interface TappletProps {
    source: string;
}

export const Tapplet = ({ source }: TappletProps) => {
    const tappletRef = useRef<HTMLIFrameElement | null>(null);
    const tappSigner = useTappletSignerStore((s) => s.tappletSigner);
    const runTransaction = useTappletSignerStore((s) => s.runTransaction);
    const language = useConfigUIStore((s) => s.application_language);
    const theme = useUIStore((s) => s.theme);
    const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
    const [pendingDomains, setPendingDomains] = useState<string[] | null>(null);
    const [showDomainPopup, setShowDomainPopup] = useState(false);

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

    useIframeMessage((event) => {
        switch (event.data.type) {
            case MessageType.SET_ALLOWED_DOMAINS: {
                const domains = event.data.payload?.domains || [];
                setPendingDomains(domains);
                setShowDomainPopup(true);
                break;
            }
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
                console.info('[TAPPLET] domains ', allowedDomains);

                const url = event.data.payload.url;
                try {
                    const { hostname } = new URL(url);
                    console.info('[TAPPLET] url ', url);
                    console.info('[TAPPLET] hos ', hostname);
                    if (allowedDomains.includes(hostname)) {
                        openExternalLink(url);
                    } else {
                        setStoreError(
                            `Can't access the external domain due to permission restrictions: ${hostname}`,
                            true
                        );
                    }
                } catch {
                    setStoreError(`Invalid URL: ${url}`, true);
                }
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

    // Popup approval handler
    const handleApproveDomains = useCallback(async () => {
        try {
            if (pendingDomains) {
                setAllowedDomains((prev) => Array.from(new Set([...prev, ...pendingDomains])));
                setPendingDomains(null);
                setShowDomainPopup(false);
            }
        } catch (e) {
            console.error('Error approving domains:', e);
        }
    }, [pendingDomains]);

    const handleRejectDomains = () => {
        setPendingDomains(null);
        setShowDomainPopup(false);
    };

    return (
        <TappletContainer>
            {showDomainPopup && pendingDomains && (
                <div
                    style={{
                        position: 'absolute',
                        zIndex: 10,
                        background: 'black',
                        border: '1px solid #ccc',
                        padding: 24,
                        width: 400,
                        left: '50%',
                        top: 100,
                        transform: 'translateX(-50%)',
                    }}
                >
                    <h3>Allow these domains?</h3>
                    <ul>
                        {pendingDomains.map((domain) => (
                            <li key={domain}>{domain}</li>
                        ))}
                    </ul>
                    <button onClick={handleApproveDomains}>Approve</button>
                    <button onClick={handleRejectDomains}>Reject</button>
                </div>
            )}
            <iframe
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
