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
