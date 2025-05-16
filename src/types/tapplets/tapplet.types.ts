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

export interface BuiltInTapplet {
    id: number;
    version: string;
    endpoint: string;
    destDir: string;
    package_name?: string;
    display_name?: string;
    about_summary?: string;
    about_description?: string;
}

export interface TappletConfig {
    packageName: string;
    version: string;
    permissions: object;
    supportedChain: SupportedChain[];
}

export interface SendOneSidedRequest {
    amount: number;
    address: string;
    paymentId?: string;
}
