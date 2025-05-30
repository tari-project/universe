import { Token, CurrencyAmount, Price, NativeCurrency } from '@uniswap/sdk-core';
import { FeeAmount, Pool } from '@uniswap/v3-sdk';

export interface V3PoolInfo {
    sqrtPriceX96: bigint;
    liquidity: bigint;
    tick: number;
    poolContract: Pool;
}

// Represents a single leg in a multi-hop swap path
export interface SwapLeg {
    poolAddress: string; // For debugging or direct pool interaction
    tokenIn: Token;
    tokenOut: Token;
    fee: FeeAmount;
    // Optional: raw pool data if fetched
    sqrtRatioX96?: bigint;
    liquidity?: bigint;
    tickCurrent?: number;
}

export interface V3TradeDetails {
    // For QuoterV2 based approach:
    inputToken?: Token | NativeCurrency;
    outputToken?: Token | NativeCurrency;
    inputAmount?: CurrencyAmount<Token | NativeCurrency>;
    outputAmount?: CurrencyAmount<Token | NativeCurrency>; // Quoted output amount

    estimatedGasFeeNative?: string | null;
    estimatedGasFeeUSD?: string | null; // If you calculate this

    // V3 specific details you might get or calculate:
    // sqrtPriceX96After?: bigint;
    // initializedTicksCrossed?: number;

    // Simplified details for UI:
    minimumReceived?: CurrencyAmount<Token | NativeCurrency> | null;
    executionPrice?: Price<Token | NativeCurrency, Token | NativeCurrency> | null;
    priceImpactPercent?: string | null; // Harder to calculate accurately with QuoterV2 alone
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    path?: any;
}

export type SwapField = 'ethTokenField' | 'wxtmField';
export type SwapDirection = 'fromXtm' | 'toXtm';

export interface SwapTransaction {
    amount: string;
    targetAmount: string;
    direction: SwapDirection;
    slippage?: string | null;
    networkFee?: string | null;
    priceImpact?: string | null;
    minimumReceived?: string | null;
    executionPrice?: string | null;
    transactionId?: string | null;
    paidTransactionFeeApproval?: string | null;
    paidTransactionFeeSwap?: string | null;
    txBlockHash?: `0x${string}` | null;
}

export interface TradeLeg {
    tokenIn: Token;
    tokenOut: Token;
    fee: FeeAmount;
}
