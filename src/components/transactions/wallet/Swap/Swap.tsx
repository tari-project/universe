import { BackButton, IframeContainer, SectionHeaderWrapper, SwapsContainer, SwapsIframe } from './Swap.styles';
import { HeaderLabel, TabHeader } from '../../components/Tabs/tab.styles';
import {
    SwapConfirmation,
    SwapConfirmationTransactionProps,
} from '@app/containers/floating/SwapDialogs/sections/SwapConfirmation/SwapConfirmation';
import {
    ProccessingTransactionProps,
    ProcessingTransaction,
} from '@app/containers/floating/SwapDialogs/sections/ProcessingTransaction/ProcessingTransaction';

import { useState, useRef, useEffect, useCallback } from 'react'; // Added useRef
import { SignApprovalMessage } from '@app/containers/floating/SwapDialogs/sections/SignMessage/SignApprovalMessage';
import { useTranslation } from 'react-i18next';
import { setIsSwapping } from '@app/store/actions/walletStoreActions';
import { MessageType, useIframeMessage } from '@app/hooks/swap/useIframeMessage';
import { useUIStore } from '@app/store';
import { useIframeUrl } from '@app/hooks/swap/useIframeUrl';
import LoadingDots from '@app/components/elements/loaders/LoadingDots';

export const Swap = () => {
    const theme = useUIStore((s) => s.theme);
    const [processingOpen, setProcessingOpen] = useState(false);
    const [processingTransaction, setProcessingTransaction] = useState<ProccessingTransactionProps | null>(null);
    const [approving, setApproving] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [confirmingTransaction, setConfirmingTransaction] = useState<SwapConfirmationTransactionProps | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [walletConnectOpen, setWalletConnectOpen] = useState(false);
    const [swapHeight, setSwapHeight] = useState(0);
    const iframeUrl = useIframeUrl();
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const { t } = useTranslation(['wallet'], { useSuspense: false });

    const handleSetTheme = useCallback(() => {
        if (!iframeUrl) return;
        setTimeout(() => {
            if (iframeRef.current) {
                iframeRef.current.contentWindow?.postMessage({ type: 'SET_THEME', payload: { theme } }, '*');
            }
        }, 1000);
    }, [iframeUrl, theme]);
    useEffect(() => {
        // Keep the iframe theme in sync with the app theme
        handleSetTheme();
        const timeout = setTimeout(handleSetTheme, 1000);
        return () => {
            clearTimeout(timeout);
        };
    }, [handleSetTheme]);

    const handleClearState = () => {
        setApproving(false);
        setConfirming(false);
        setProcessingOpen(false);
        setConfirmingTransaction(null);
        setProcessingTransaction(null);
    };
    useIframeMessage((event) => {
        switch (event.data.type) {
            case MessageType.CONFIRM_REQUEST:
                setConfirming(true);
                setConfirmingTransaction({
                    fromTokenDisplay: event.data.payload.fromTokenDisplay,
                    toTokenDisplay: event.data.payload.toTokenDisplay,
                    toTokenSymbol: event.data.payload.toTokenSymbol,
                    transaction: event.data.payload.transaction,
                });
                break;
            case MessageType.APPROVE_REQUEST:
                setApproving(true);
                break;
            case MessageType.SET_FULLSCREEN:
                setIsFullscreen(event.data.payload.open);
                break;
            case MessageType.APPROVE_SUCCESS:
                setApproving(false);
                break;
            case MessageType.PROCESSING_STATUS: {
                setApproving(false);
                setProcessingTransaction(event.data.payload);
                if (processingTransaction?.status !== 'error') {
                    setProcessingOpen(true);
                }
                break;
            }
            case MessageType.WALLET_CONNECT:
                setWalletConnectOpen(event.data.payload.open);
                break;
            case MessageType.SWAP_HEIGHT_CHANGE:
                setSwapHeight(event.data.payload.height);
                break;
            case MessageType.ERROR:
                handleClearState();
                setError(event.data.payload.message);
                break;
        }
    });

    const handleConfirmTransaction = async () => {
        if (iframeRef.current) {
            handleClearState();
            setApproving(true);
            iframeRef.current.contentWindow?.postMessage({ type: 'EXECUTE_SWAP' }, '*');
        }
    };

    const handleAddXtmToWallet = () => {
        if (iframeRef.current) {
            iframeRef.current.contentWindow?.postMessage({ type: 'ADD_XTM_TO_WALLET' }, '*');
        }
    };

    return (
        <SwapsContainer>
            <TabHeader $noBorder $hidden={isFullscreen}>
                <SectionHeaderWrapper>
                    <HeaderLabel>{t('swap.buy-tari')}</HeaderLabel>
                    <BackButton onClick={() => setIsSwapping(false)}>{t('swap.back-button')}</BackButton>
                </SectionHeaderWrapper>
            </TabHeader>
            <IframeContainer>
                {iframeUrl ? (
                    <SwapsIframe
                        $swapHeight={swapHeight}
                        $walletConnectOpen={walletConnectOpen}
                        ref={iframeRef}
                        src={iframeUrl}
                        title="Swap Iframe"
                        onLoad={handleSetTheme}
                    />
                ) : (
                    <LoadingDots />
                )}
            </IframeContainer>
            {/* Floating Elements */}
            <SwapConfirmation
                isOpen={confirming}
                setIsOpen={setConfirming}
                onConfirm={handleConfirmTransaction}
                transaction={confirmingTransaction?.transaction}
                fromTokenDisplay={confirmingTransaction?.fromTokenDisplay}
                toTokenDisplay={confirmingTransaction?.toTokenDisplay}
                toTokenSymbol={confirmingTransaction?.toTokenSymbol}
            />
            <ProcessingTransaction
                status={processingTransaction?.status}
                isOpen={processingOpen}
                setIsOpen={setProcessingOpen}
                handleAddXtmToWallet={handleAddXtmToWallet}
                fromTokenSymbol={processingTransaction?.fromTokenSymbol}
                fromTokenAmount={processingTransaction?.fromTokenAmount}
                toTokenSymbol={processingTransaction?.toTokenSymbol}
                toTokenAmount={processingTransaction?.toTokenAmount}
                fees={{
                    approval: processingTransaction?.fees?.approval ?? null,
                    swap: processingTransaction?.fees?.swap ?? null,
                }}
                txBlockHash={processingTransaction?.txBlockHash ?? undefined}
                transactionId={processingTransaction?.transactionId ?? undefined}
                errorMessage={error}
            />
            <SignApprovalMessage isOpen={approving} setIsOpen={setApproving} />
        </SwapsContainer>
    );
};
