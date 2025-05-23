import { Token, CurrencyAmount, TradeType, Price, NativeCurrency } from '@uniswap/sdk-core';
import { Route, Trade } from '@uniswap/v2-sdk';

export interface TradeDetails {
    trade: Trade<Token, Token, TradeType> | null;
    route: Route<Token, Token> | null;
    estimatedGasFeeNative?: string | null; // Allow null
    estimatedGasFeeUSD?: string | null; // Allow null
    midPrice?: Price<Token, Token>;
    inputAmount?: CurrencyAmount<Token>;
    outputAmount?: CurrencyAmount<Token>;
    minimumReceived?: CurrencyAmount<Token | NativeCurrency> | null; // Added
    executionPrice?: Price<Token | NativeCurrency, Token | NativeCurrency> | null; // Added
    priceImpactPercent?: string | null; // Added
}

export type SwapField = 'ethTokenField' | 'wxtmField';
export type SwapDirection = 'fromXtm' | 'toXtm';

export interface SwapTransaction {
    amount: string;
    targetAmount: string;
    direction: SwapDirection;
    slippage?: string | null; // This seems to be set to priceImpact, consider if it should be different
    networkFee?: string | null; // Estimated network fee for the swap
    priceImpact?: string | null; // Added for clarity
    minimumReceived?: string | null; // Added
    executionPrice?: string | null; // Added
    transactionId?: string | null;
    paidTransactionFeeApproval?: string | null;
    paidTransactionFeeSwap?: string | null;
    txBlockHash?: `0x${string}` | null;
}
