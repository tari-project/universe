import { useEffect } from 'react';
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
