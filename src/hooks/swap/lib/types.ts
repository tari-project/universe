import { Token, CurrencyAmount, TradeType, Price } from '@uniswap/sdk-core';
import { Route, Trade } from '@uniswap/v2-sdk';

export interface TradeDetails {
    trade: Trade<Token, Token, TradeType> | null;
    route: Route<Token, Token> | null;
    estimatedGasFeeNative?: string;
    estimatedGasFeeUSD?: string;
    midPrice?: Price<Token, Token>;
    inputAmount?: CurrencyAmount<Token>;
    outputAmount?: CurrencyAmount<Token>;
}

export type SwapField = 'fromValue' | 'target';
