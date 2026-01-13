export type SupportedChain = 'MAINNET' | 'STAGENET' | 'NEXTNET' | '';

export interface WindowSize {
    width: number;
    height: number;
}

export interface TappletSignerParams {
    id: string;
    name?: string;
    onConnection?: () => void;
}

export interface AccountData {
    account_id: number;
    address: string;
}

export interface ActiveTapplet {
    tapplet_id: number;
    display_name: string;
    source: string;
    version: string;
    supportedChain: SupportedChain[];
}

export interface SendOneSidedRequest {
    amount: string;
    address: string;
    paymentId?: string;
}

export interface BridgeTxDetails {
    amount: string;
    amountToReceive: string;
    destinationAddress: string;
    paymentId: string;
}

export enum MessageType {
    SIGNER_CALL = 'signer-call',
    RESIZE = 'resize',
    SET_LANGUAGE = 'SET_LANGUAGE',
    SET_THEME = 'SET_THEME',
    SET_FEATURES = 'SET_FEATURES',
}

interface SignerCallMessage {
    type: MessageType.SIGNER_CALL;
    payload: {
        methodName: string;
        args: unknown;
    };
}

interface ResizeMessage {
    type: MessageType.RESIZE;
    width: number;
    height: number;
}

interface SetLanguageMessage {
    type: MessageType.SET_LANGUAGE;
    payload: { language: string };
}

interface SetThemeMessage {
    type: MessageType.SET_THEME;
    payload: { theme: string };
}

export type IframeMessage = SignerCallMessage | ResizeMessage | SetLanguageMessage | SetThemeMessage;
