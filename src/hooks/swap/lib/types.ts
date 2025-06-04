export type SwapDirection = 'fromXtm' | 'toXtm';
export type SwapStatus = 'processingapproval' | 'processingswap' | 'success' | 'error';

export interface SelectableTokenInfo {
    label: string;
    symbol: string;
    address: `0x${string}` | null;
    iconSymbol: string;
    definition: unknown;
    balance?: string;
    usdValue?: string;
    rawBalance?: bigint;
    decimals: number;
    pricePerTokenUSD?: number;
}
