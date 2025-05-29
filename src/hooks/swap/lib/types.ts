import { Token, CurrencyAmount, Price, NativeCurrency } from '@uniswap/sdk-core';
import { FeeAmount, Pool } from '@uniswap/v3-sdk';

export interface V3PoolInfo {
    sqrtPriceX96: bigint;
    liquidity: bigint;
    tick: number;
    poolContract: Pool;
}

export interface V3TradeDetails {
    // If using QuoterV2 directly, you might not have a full Trade object
    // but rather the direct outputs.
    // If building a full V3 Trade object, this would be:
    // trade: TradeV3<Token, Token, TradeType.EXACT_INPUT | TradeType.EXACT_OUTPUT> | null;
    // route: RouteV3<Token, Token> | null;

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
