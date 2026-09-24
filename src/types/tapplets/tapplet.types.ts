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

/**
 * Balance shape the shipped bridge tapplet reads (`balance?.available_balance` in
 * wxtm-bridge-frontend v0.4.2 `store/account.ts`). Renaming these fields blanks the
 * bridge balance, so keep them until the pinned bridge build is bumped.
 */
export interface TappletWalletBalance {
    available_balance: number;
    timelocked_balance: number;
    pending_incoming_balance: number;
    pending_outgoing_balance: number;
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
