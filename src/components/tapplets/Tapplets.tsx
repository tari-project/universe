import { useCallback, useEffect, useRef } from 'react';
import { useTappletProviderStore } from '@app/store/useTappletProviderStore';
import { MiningViewContainer } from '@app/containers/main/Dashboard/MiningView/MiningView.styles';

interface TappletProps {
    source: string;
}

export const Tapplet: React.FC<TappletProps> = ({ source }) => {
    const tappletRef = useRef<HTMLIFrameElement | null>(null);
    const provider = useTappletProviderStore((s) => s.tappletProvider);
    const runTransaction = useTappletProviderStore((s) => s.runTransaction);

    function sendWindowSize() {
        if (tappletRef.current) {
            const height = tappletRef.current.offsetHeight;
            const width = tappletRef.current.offsetWidth;
            const tappletWindow = tappletRef.current.contentWindow;

            provider?.setWindowSize(width, height);
            provider?.sendWindowSizeMessage(tappletWindow, source);
        }
    }

    function handleMessage(event: MessageEvent) {
        if (event.data.type === 'request-parent-size') {
            if (tappletRef.current) {
                const height = tappletRef.current.offsetHeight;
                const width = tappletRef.current.offsetWidth;
                const tappletWindow = tappletRef.current.contentWindow;

                provider?.setWindowSize(width, height);
                provider?.sendWindowSizeMessage(tappletWindow, source);
            }
        } else if (event.data.type === 'signer-call') {
            console.info('🤝 [TU Tapplet][handle msg] event data:', event.data);
            runTappletTx(event);
        }
    }

    const runTappletTx = useCallback(
        async (event: MessageEvent) => {
            await runTransaction(event);
        },
        [runTransaction]
    );

    useEffect(() => {
        window.addEventListener('resize', sendWindowSize);
        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('resize', sendWindowSize);
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    return (
        <MiningViewContainer>
            <iframe
                src={source}
                width="100%"
                height="100%"
                ref={tappletRef}
                onLoad={sendWindowSize}
                style={{ background: 'transparent', border: 'none' }}
            ></iframe>
        </MiningViewContainer>
    );
};
