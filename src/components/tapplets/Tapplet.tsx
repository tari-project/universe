import { useCallback, useEffect, useMemo, useRef } from 'react';
import { open } from '@tauri-apps/plugin-shell';
import { useConfigUIStore, useUIStore, setError as setStoreError } from '@app/store';
import { TappletContainer } from '@app/containers/main/Dashboard/MiningView/MiningView.styles';
import { runTappletTransaction } from '@app/store/useTappletSignerStore.ts';
import { isAllowedExternalUrl } from '@app/utils/externalUrl.ts';

interface TappletProps {
    source: string;
}

/**
 * The tapplet is served from a local http server, so its origin is exactly the origin of the
 * iframe source. Returns `null` when the source is empty or cannot be parsed, in which case no
 * message channel may be trusted.
 */
function getTappletOrigin(source: string): string | null {
    if (!source) return null;

    try {
        const { origin } = new URL(source);
        return origin && origin !== 'null' ? origin : null;
    } catch {
        return null;
    }
}

export const Tapplet = ({ source }: TappletProps) => {
    const tappletRef = useRef<HTMLIFrameElement | null>(null);
    const untrustedMessageWarned = useRef(false);
    const appLanguage = useConfigUIStore((s) => s.application_language);
    const theme = useUIStore((s) => s.theme);
    const tappletOrigin = useMemo(() => getTappletOrigin(source), [source]);

    const openExternalLink = useCallback(async (event: MessageEvent) => {
        const url = event.data?.url;
        if (!isAllowedExternalUrl(url)) {
            console.warn('Blocked tapplet request to open an invalid external URL');
            return;
        }
        console.info('Opening external tapplet URL:', url);
        try {
            await open(url);
        } catch (e) {
            setStoreError(`Open tapplet URL error: ${e}`, true);
        }
    }, []);

    const sendAppLanguage = useCallback(() => {
        if (tappletRef.current && tappletOrigin) {
            tappletRef.current.contentWindow?.postMessage(
                { type: 'SET_LANGUAGE', payload: { language: appLanguage } },
                tappletOrigin
            );
        }
    }, [appLanguage, tappletOrigin]);

    const sendTheme = useCallback(() => {
        if (tappletRef.current && tappletOrigin) {
            tappletRef.current.contentWindow?.postMessage({ type: 'SET_THEME', payload: { theme } }, tappletOrigin);
        }
    }, [theme, tappletOrigin]);

    /**
     * Only the tapplet we embedded may talk to us: the message has to come from the iframe's own
     * window and carry the exact origin the iframe was pointed at. Anything else (other frames,
     * opened windows, the app itself) is dropped before it can reach the signer.
     */
    const isTrustedTappletMessage = useCallback(
        (event: MessageEvent) => {
            const tappletWindow = tappletRef.current?.contentWindow;
            if (!tappletOrigin || !tappletWindow) return false;
            return event.source === tappletWindow && event.origin === tappletOrigin;
        },
        [tappletOrigin]
    );

    const handleMessage = useCallback(
        async (event: MessageEvent) => {
            if (!isTrustedTappletMessage(event)) {
                if (!untrustedMessageWarned.current) {
                    untrustedMessageWarned.current = true;
                    console.warn(
                        `Ignoring tapplet message from untrusted sender (origin: "${event.origin}", expected: "${tappletOrigin}"). Further messages will be dropped silently.`
                    );
                }
                return;
            }

            switch (event.data?.type) {
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
                    setStoreError(`${event.data.payload?.message}`, true);
                    break;
            }
        },
        [isTrustedTappletMessage, openExternalLink, sendAppLanguage, sendTheme, tappletOrigin]
    );

    useEffect(() => {
        // Without a valid tapplet origin there is nothing we could ever trust, so don't listen at all.
        if (!tappletOrigin) {
            console.warn('Tapplet source is missing or invalid, message handling is disabled');
            return;
        }
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [handleMessage, tappletOrigin]);

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
