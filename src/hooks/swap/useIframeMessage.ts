import { useEffect, useRef } from 'react';
import { SelectableTokenInfo, SwapDirection, SwapStatus } from './lib/types';

export enum MessageType {
    ERROR = 'ERROR',
    SUCCESS = 'SUCCESS',
    APPROVE_REQUEST = 'APPROVE_REQUEST',
    APPROVE_SUCCESS = 'APPROVE_SUCCESS',
    WALLET_CONNECT = 'WALLET_CONNECT',
    CONFIRM_REQUEST = 'CONFIRM_REQUEST',
    PROCESSING_STATUS = 'PROCESSING_STATUS',
    SWAP_HEIGHT_CHANGE = 'SWAP_HEIGHT_CHANGE',
    SET_FULLSCREEN = 'SET_FULLSCREEN',
}

interface SwapHeightChangeMessage {
    type: MessageType.SWAP_HEIGHT_CHANGE;
    payload: {
        height: number;
    };
}

interface SetFullscreenMessage {
    type: MessageType.SET_FULLSCREEN;
    payload: {
        open: boolean;
    };
}

interface SwapConfirmation {
    type: MessageType.CONFIRM_REQUEST;
    payload: {
        fromTokenDisplay?: SelectableTokenInfo;
        toTokenDisplay?: SelectableTokenInfo;
        toTokenSymbol?: string;
        transaction: {
            amount: string;
            targetAmount: string;
            direction: SwapDirection;
            slippage?: string | null;
            networkFee?: string | null;
            priceImpact?: string | null;
            minimumReceived?: string | null;
            executionPrice?: string | null;
            transactionId?: string | null;
            paidTransactionFee?: string | null;
        };
    };
}

interface ApproveMessage {
    type: MessageType.APPROVE_REQUEST;
}

interface ApproveSuccessMessage {
    type: MessageType.APPROVE_SUCCESS;
}

interface ErrorMessage {
    type: MessageType.ERROR;
    payload: {
        message: string;
    };
}

interface WalletConnectMessage {
    type: MessageType.WALLET_CONNECT;
    payload: {
        open: boolean;
    };
}

interface SuccessMessage {
    type: MessageType.SUCCESS;
    payload: {
        status: 'pending' | 'success' | 'error';
        txId?: string;
    };
}

interface ProcessingMessage {
    type: MessageType.PROCESSING_STATUS;
    payload: {
        status: SwapStatus;
        fees?: { approval: string | null; swap: string | null };
        transactionId?: string | null; // Hash of the swap transaction
        txBlockHash?: `0x${string}` | null;
        errorMessage?: string | null; // Added for error status
    };
}

export type IframeMessage =
    | ApproveMessage
    | ApproveSuccessMessage
    | SwapConfirmation
    | ErrorMessage
    | SuccessMessage
    | WalletConnectMessage
    | SwapHeightChangeMessage
    | SetFullscreenMessage
    | ProcessingMessage;

/**
 * A message is only trusted when it comes from a window we embedded ourselves - i.e. the swap
 * iframe - and when it speaks from the exact origin that iframe was pointed at. Random windows,
 * popups and nested frames are dropped.
 */
function isTrustedIframeMessage(event: MessageEvent): boolean {
    if (!event.source) return false;

    const frames = Array.from(document.querySelectorAll('iframe'));
    const sender = frames.find((frame) => frame.contentWindow && frame.contentWindow === event.source);
    if (!sender?.src) return false;

    try {
        return event.origin === new URL(sender.src, window.location.href).origin;
    } catch {
        return false;
    }
}

// Hook to listen for messages from the swap iframe
export function useIframeMessage(onMessage: (event: MessageEvent<IframeMessage>) => void) {
    const untrustedMessageWarned = useRef(false);

    useEffect(() => {
        function handleMessage(event: MessageEvent<IframeMessage>) {
            if (!isTrustedIframeMessage(event)) {
                if (!untrustedMessageWarned.current) {
                    untrustedMessageWarned.current = true;
                    console.warn(
                        `Ignoring iframe message from untrusted sender (origin: "${event.origin}"). Further messages will be dropped silently.`
                    );
                }
                return;
            }
            onMessage(event);
        }
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [onMessage]);
}
