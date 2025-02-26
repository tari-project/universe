import { useTappletProviderStore } from '@app/store/useTappletProviderStore';
import { useUIStore } from '@app/store/useUIStore';
import { TappletProvider } from '@app/types/ootle/TappletProvider';
import { useCallback, useEffect, useRef } from 'react';

interface TappletProps {
    source: string;
    provider?: TappletProvider;
}

export const Tapplet: React.FC<TappletProps> = ({ source, provider }) => {
    const tappletRef = useRef<HTMLIFrameElement | null>(null);
    const runTransaction = useTappletProviderStore((s) => s.runTransaction);
    const addTransaction = useTappletProviderStore((s) => s.addTransaction);
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);

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
        } else if (event.data.type === 'provider-call') {
            console.info('🤝 [TU Tapplet][handle msg] event data:', event.data);
            console.info('🤝 [TU Tapplet][handle msg] TX ADDED');
            if (event.data.methodName === 'submitTransaction') {
                addTransaction(event);
                setDialogToShow('txSimulation');
                // runTappletTxSimulation(event);
                return;
            }
            runTappletTx(event);
        }
    }

    const runTappletTx = useCallback(
        async (event: MessageEvent) => {
            await runTransaction(event);
        },
        [runTransaction]
    );

    // const runTappletTxSimulation = useCallback(
    //     async (event: MessageEvent) => {
    //         console.warn('SIIIIMULATION run TX');
    //         const { balanceUpdates, txSimulation } = await runSimulation(event.data.id);
    //         console.warn('SIIIIMULATION RES TX', txSimulation);
    //         console.warn('SIIIIMULATION RES BALANCES', balanceUpdates);
    //     },
    //     [runSimulation]
    // );

    useEffect(() => {
        window.addEventListener('resize', sendWindowSize);
        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('resize', sendWindowSize);
            window.removeEventListener('message', handleMessage);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <iframe src={source} width="100%" height="100%" ref={tappletRef} onLoad={sendWindowSize}></iframe>;
};
