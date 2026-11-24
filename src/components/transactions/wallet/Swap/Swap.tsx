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

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { SignApprovalMessage } from '@app/containers/floating/SwapDialogs/sections/SignMessage/SignApprovalMessage';
import { useTranslation } from 'react-i18next';
import { setIsSwapping } from '@app/store/actions/walletStoreActions';
import { IframeMessage, MessageType, useIframeMessage } from '@app/hooks/swap/useIframeMessage';
import { useUIStore } from '@app/store';
import { getIframeOrigin } from '@app/utils/iframeOrigin';
import { useIframeUrl } from '@app/hooks/swap/useIframeUrl';
import LoadingDots from '@app/components/elements/loaders/LoadingDots';

const EMPTY_CONFIRMATION: SwapConfirmationTransactionProps = {
    transaction: undefined,
    fromTokenDisplay: undefined,
    toTokenDisplay: undefined,
    toTokenSymbol: undefined,
};

const EMPTY_PROCESSING: ProccessingTransactionProps = {
    status: undefined,
    fromTokenSymbol: undefined,
    fromTokenAmount: undefined,
    toTokenSymbol: undefined,
    toTokenAmount: undefined,
    fees: { approval: null, swap: null },
    txBlockHash: undefined,
    transactionId: undefined,
};

interface SwapViewState {
    processingOpen: boolean;
    processingTransaction: ProccessingTransactionProps;
    approving: boolean;
    confirming: boolean;
    confirmingTransaction: SwapConfirmationTransactionProps;
    error: string | null;
    walletConnectOpen: boolean;
    swapHeight: number;
    isFullscreen: boolean;
}

const INITIAL_VIEW_STATE: SwapViewState = {
    processingOpen: false,
    processingTransaction: EMPTY_PROCESSING,
    approving: false,
    confirming: false,
    confirmingTransaction: EMPTY_CONFIRMATION,
    error: null,
    walletConnectOpen: false,
    swapHeight: 0,
    isFullscreen: false,
};

function resetModalState(prev: SwapViewState): SwapViewState {
    return {
        ...prev,
        approving: false,
        confirming: false,
        processingOpen: false,
        confirmingTransaction: EMPTY_CONFIRMATION,
        processingTransaction: EMPTY_PROCESSING,
    };
}

function applyProcessingMessage(prev: SwapViewState, payload: ProccessingTransactionProps): SwapViewState {
    const shouldOpen = prev.processingTransaction.status !== 'error';
    return {
        ...prev,
        approving: false,
        processingTransaction: payload,
        processingOpen: shouldOpen ? true : prev.processingOpen,
    };
}

type MsgOf<T extends MessageType> = Extract<IframeMessage, { type: T }>;
type MessageUpdater = (prev: SwapViewState, data: never) => SwapViewState;

const MESSAGE_UPDATERS: Partial<Record<MessageType, MessageUpdater>> = {
    [MessageType.CONFIRM_REQUEST]: (prev, msg: MsgOf<MessageType.CONFIRM_REQUEST>) => ({
        ...prev,
        confirming: true,
        confirmingTransaction: msg.payload,
    }),
    [MessageType.APPROVE_REQUEST]: (prev) => ({ ...prev, approving: true }),
    [MessageType.SET_FULLSCREEN]: (prev, msg: MsgOf<MessageType.SET_FULLSCREEN>) => ({
        ...prev,
        isFullscreen: msg.payload.open,
    }),
    [MessageType.APPROVE_SUCCESS]: (prev) => ({ ...prev, approving: false }),
    [MessageType.PROCESSING_STATUS]: (prev, msg: MsgOf<MessageType.PROCESSING_STATUS>) =>
        applyProcessingMessage(prev, msg.payload),
    [MessageType.WALLET_CONNECT]: (prev, msg: MsgOf<MessageType.WALLET_CONNECT>) => ({
        ...prev,
        walletConnectOpen: msg.payload.open,
    }),
    [MessageType.SWAP_HEIGHT_CHANGE]: (prev, msg: MsgOf<MessageType.SWAP_HEIGHT_CHANGE>) => ({
        ...prev,
        swapHeight: msg.payload.height,
    }),
    [MessageType.ERROR]: (prev, msg: MsgOf<MessageType.ERROR>) => ({
        ...resetModalState(prev),
        error: msg.payload.message,
    }),
};

function reduceSwapMessage(prev: SwapViewState, message: IframeMessage): SwapViewState {
    const updater = MESSAGE_UPDATERS[message.type];
    return updater ? updater(prev, message as never) : prev;
}

export const Swap = () => {
    const theme = useUIStore((s) => s.theme);
    const [state, setState] = useState<SwapViewState>(INITIAL_VIEW_STATE);
    const iframeUrl = useIframeUrl();
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const iframeOrigin = useMemo(() => getIframeOrigin(iframeUrl), [iframeUrl]);
    const { t } = useTranslation(['wallet'], { useSuspense: false });

    // Post only to the allowlisted origin we loaded, never '*': a navigated-away iframe
    // must not receive app messages.
    const postToIframe = useCallback(
        (message: { type: string; payload?: unknown }) => {
            if (!iframeOrigin || !iframeRef.current) return;
            iframeRef.current.contentWindow?.postMessage(message, iframeOrigin);
        },
        [iframeOrigin]
    );

    const handleSetTheme = useCallback(() => {
        if (!iframeUrl) return;
        setTimeout(() => {
            postToIframe({ type: 'SET_THEME', payload: { theme } });
        }, 1000);
    }, [iframeUrl, postToIframe, theme]);

    useEffect(() => {
        handleSetTheme();
        const timeout = setTimeout(handleSetTheme, 1000);
        return () => clearTimeout(timeout);
    }, [handleSetTheme]);

    useIframeMessage(iframeRef, (event) => {
        setState((prev) => reduceSwapMessage(prev, event.data));
    });

    const handleConfirmTransaction = () => {
        if (!iframeRef.current) return;
        setState((prev) => ({ ...resetModalState(prev), approving: true }));
        postToIframe({ type: 'EXECUTE_SWAP' });
    };

    const handleAddXtmToWallet = () => postToIframe({ type: 'ADD_XTM_TO_WALLET' });
    const tx = state.processingTransaction;
    const fees = tx.fees ?? { approval: null, swap: null };

    return (
        <SwapsContainer>
            <TabHeader $noBorder $hidden={state.isFullscreen}>
                <SectionHeaderWrapper>
                    <HeaderLabel>{t('swap.buy-tari')}</HeaderLabel>
                    <BackButton onClick={() => setIsSwapping(false)}>{t('swap.back-button')}</BackButton>
                </SectionHeaderWrapper>
            </TabHeader>
            <IframeContainer>
                {iframeUrl ? (
                    <SwapsIframe
                        $swapHeight={state.swapHeight}
                        $walletConnectOpen={state.walletConnectOpen}
                        ref={iframeRef}
                        src={iframeUrl}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        title="Swap Iframe"
                        onLoad={handleSetTheme}
                    />
                ) : (
                    <LoadingDots />
                )}
            </IframeContainer>
            <SwapConfirmation
                isOpen={state.confirming}
                setIsOpen={(open) => setState((prev) => ({ ...prev, confirming: Boolean(open) }))}
                onConfirm={handleConfirmTransaction}
                transaction={state.confirmingTransaction.transaction}
                fromTokenDisplay={state.confirmingTransaction.fromTokenDisplay}
                toTokenDisplay={state.confirmingTransaction.toTokenDisplay}
                toTokenSymbol={state.confirmingTransaction.toTokenSymbol}
            />
            <ProcessingTransaction
                status={tx.status}
                isOpen={state.processingOpen}
                setIsOpen={(open) => setState((prev) => ({ ...prev, processingOpen: Boolean(open) }))}
                handleAddXtmToWallet={handleAddXtmToWallet}
                fromTokenSymbol={tx.fromTokenSymbol}
                fromTokenAmount={tx.fromTokenAmount}
                toTokenSymbol={tx.toTokenSymbol}
                toTokenAmount={tx.toTokenAmount}
                fees={{ approval: fees.approval ?? null, swap: fees.swap ?? null }}
                txBlockHash={tx.txBlockHash ?? undefined}
                transactionId={tx.transactionId ?? undefined}
                errorMessage={state.error}
            />
            <SignApprovalMessage
                isOpen={state.approving}
                setIsOpen={(open) => setState((prev) => ({ ...prev, approving: Boolean(open) }))}
            />
        </SwapsContainer>
    );
};
