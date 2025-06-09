import { useCallback, useEffect, useRef } from 'react';
import { useTappletSignerStore } from '@app/store/useTappletSignerStore';
import { MiningViewContainer } from '@app/containers/main/Dashboard/MiningView/MiningView.styles';

interface TappletProps {
    source: string;
}

export const Tapplet: React.FC<TappletProps> = ({ source }) => {
    const tappletRef = useRef<HTMLIFrameElement | null>(null);
    const provider = useTappletSignerStore((s) => s.tappletSigner);
    const runTransaction = useTappletSignerStore((s) => s.runTransaction);

    const sendWindowSize = useCallback(() => {
        if (tappletRef.current) {
            const height = tappletRef.current.offsetHeight;
            const width = tappletRef.current.offsetWidth;
            const tappletWindow = tappletRef.current.contentWindow;
            // use "*" for targetOrigin to bypass strict origin checks for custom protocols
            const targetOrigin = '*';

            provider?.setWindowSize(width, height);
            provider?.sendWindowSizeMessage(tappletWindow, targetOrigin);
        }
    }, [provider]);

    const runTappletTx = useCallback(
        async (event: MessageEvent) => {
            await runTransaction(event);
        },
        [runTransaction]
    );

    const handleMessage = useCallback(
        (event: MessageEvent) => {
            if (event.data.type === 'request-parent-size') {
                sendWindowSize();
            } else if (event.data.type === 'signer-call') {
                runTappletTx(event);
            }
        },
        [sendWindowSize, runTappletTx]
    );

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
        <MiningViewContainer>
            <iframe
                src={source}
                width="100%"
                height="100%"
                ref={tappletRef}
                onLoad={sendWindowSize}
                style={{ border: 'none', pointerEvents: 'all' }}
            />
        </MiningViewContainer>
    );
};
