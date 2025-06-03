import { useEffect } from 'react';
import { SelectableTokenInfo, SwapDirection, SwapStatus } from './lib/types';

export enum MessageType {
    ERROR = 'ERROR',
    SUCCESS = 'SUCCESS',
    APPROVE_REQUEST = 'APPROVE_REQUEST',
    APPROVE_SUCCESS = 'APPROVE_SUCCESS',
    CONFIRM_REQUEST = 'CONFIRM_REQUEST',
    PROCESSING_STATUS = 'PROCESSING_STATUS',
}

interface SwapConfirmation {
    type: MessageType.CONFIRM_REQUEST;
    payload: {
        fromTokenDisplay?: SelectableTokenInfo;
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
    | ProcessingMessage;

// Post a message to the parent window
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function postToParentIframe(message: Record<string, any>, targetOrigin = '*') {
    if (window.parent) {
        window.parent.postMessage(message, targetOrigin);
    }
}

// Hook to listen for messages from the parent window
export function useIframeMessage(onMessage: (event: MessageEvent<IframeMessage>) => void) {
    useEffect(() => {
        function handleMessage(event: MessageEvent<IframeMessage>) {
            // Optionally, add origin checks here for security
            onMessage(event);
        }
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [onMessage]);
}
