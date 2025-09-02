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
    GET_PARENT_SIZE = 'request-parent-size',
    SIGNER_CALL = 'SIGNER_CALL',
    BRIDGE_CALL = 'signer-call',
    GET_INIT_CONFIG = 'GET_INIT_CONFIG',
    OPEN_EXTERNAL_LINK = 'OPEN_EXTERNAL_LINK',
    SET_THEME = 'SET_THEME',
    SET_LANGUAGE = 'SET_LANGUAGE',
    NOTIFICATION = 'NOTIFICATION',
    INTER_TAPPLET = 'INTER_TAPPLET',
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

interface OpenLinkMessage {
    type: MessageType.OPEN_EXTERNAL_LINK;
    payload: {
        url: string;
    };
}

interface GetParentSizeMessage {
    type: MessageType.GET_PARENT_SIZE;
}

interface GetInitConfigMessage {
    type: MessageType.GET_INIT_CONFIG;
}

interface SignerCallMessage {
    type: MessageType.SIGNER_CALL;
}

interface BridgeCallMessage {
    type: MessageType.BRIDGE_CALL;
}

interface SetLanguageMessage {
    type: MessageType.SET_LANGUAGE;
    payload: {
        language: string;
    };
}

interface SetThemeMessage {
    type: MessageType.SET_THEME;
    payload: {
        theme: string;
    };
}

interface EmitNotificationMessage {
    type: MessageType.NOTIFICATION;
    payload: {
        notification: string;
    };
}

interface InterTappletMessage {
    type: MessageType.INTER_TAPPLET;
    payload: {
        sourceTappletRegistryId: string;
        targetTappletRegistryId: string;
        msg: string;
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
    | ProcessingMessage
    | OpenLinkMessage
    | GetParentSizeMessage
    | GetInitConfigMessage
    | SignerCallMessage
    | SetThemeMessage
    | SetLanguageMessage
    | EmitNotificationMessage
    | InterTappletMessage
    | BridgeCallMessage;

// Hook to listen for messages from the parent window
export function useIframeMessage(onMessage: (event: MessageEvent<IframeMessage>) => void) {
    useEffect(() => {
        function handleMessage(event: MessageEvent<IframeMessage>) {
            // Optionally, add origin checks here for security
            onMessage(event);
            if (event?.data.type !== undefined) console.warn('EVENT LISTENER', event.data.type, event.data);
        }
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [onMessage]);
}

export function isInterTappletMessage(msg: IframeMessage): msg is InterTappletMessage {
    return msg.type === MessageType.INTER_TAPPLET;
}
