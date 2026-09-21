import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { getIframeOrigin } from '@app/utils/iframeOrigin';
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
 * Only the swap iframe we embedded may talk to us: the message has to come from that
 * iframe's own window and carry the exact origin the iframe was pointed at. Any other
 * frame (including the tapplet iframe), popup or window is dropped.
 */
export function isTrustedIframeMessage(event: MessageEvent, iframe: HTMLIFrameElement | null): boolean {
    if (!iframe || !event.source) return false;

    const expectedOrigin = getIframeOrigin(iframe.src);
    if (!expectedOrigin) return false;

    return event.source === iframe.contentWindow && event.origin === expectedOrigin;
}

// Hook to listen for messages from the swap iframe owned by `iframeRef`
export function useIframeMessage(
    iframeRef: RefObject<HTMLIFrameElement | null>,
    onMessage: (event: MessageEvent<IframeMessage>) => void
) {
    const untrustedMessageWarned = useRef(false);

    useEffect(() => {
        function handleMessage(event: MessageEvent<IframeMessage>) {
            if (!isTrustedIframeMessage(event, iframeRef.current)) {
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
    }, [iframeRef, onMessage]);
}
