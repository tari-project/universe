export type SwapDirection = 'fromXtm' | 'toXtm';
export type SwapStatus = 'processingapproval' | 'processingswap' | 'success' | 'error';

export enum EnabledTokensEnum {
    ETH = 'ETH',
    WXTM = 'wXTM',
    USDT = 'USDT',
    USDC = 'USDC',
}

export interface SelectableTokenInfo {
    label: string;
    symbol: EnabledTokensEnum;
    address: `0x${string}` | null;
    iconSymbol: string;
    definition: unknown;
    balance?: string;
    usdValue?: string;
    rawBalance?: bigint;
    decimals: number;
    pricePerTokenUSD?: number;
}
