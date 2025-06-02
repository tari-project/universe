/* eslint-disable @typescript-eslint/no-explicit-any */
import { Token, WETH9, CurrencyAmount, NativeCurrency, Price, Percent } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';
import { usePublicClient } from 'wagmi';
import { PublicClient as ViemPublicClient, zeroAddress } from 'viem';
import { useCallback, useMemo } from 'react';

import {
    uniswapV3QuoterV2Abi,
    QUOTER_ADDRESSES_V3,
    FACTORY_ADDRESSES_V3,
    uniswapV3FactoryAbi,
    USDT_SDK_TOKEN,
    XTM_SDK_TOKEN,
    SLIPPAGE_TOLERANCE_PERCENT,
} from './lib/constants';
import { V3TradeDetails, SwapField, TradeLeg } from './lib/types';

interface UseUniswapV3PathfinderArgs {
    currentChainId: number | undefined;
    uiToken0: Token | NativeCurrency | undefined;
    uiToken1: Token | NativeCurrency | undefined;
}

interface PathfinderResult {
    tradeDetails: V3TradeDetails | null;
    error: string | null;
    isLoading: boolean;
}

const emptyPathfinderReturn: PathfinderResult = { tradeDetails: null, error: null, isLoading: false };

export const useUniswapV3Pathfinder = ({ currentChainId, uiToken0, uiToken1 }: UseUniswapV3PathfinderArgs) => {
    const publicClient = usePublicClient({ chainId: currentChainId }) as ViemPublicClient;

    const v3QuoterAddress = useMemo(
        () => (currentChainId ? QUOTER_ADDRESSES_V3[currentChainId] : undefined),
        [currentChainId]
    );
    const v3FactoryAddress = useMemo(
        () => (currentChainId ? FACTORY_ADDRESSES_V3[currentChainId] : undefined),
        [currentChainId]
    );
    const xtmToken = useMemo(() => (currentChainId ? XTM_SDK_TOKEN[currentChainId] : undefined), [currentChainId]);
    const usdtToken = useMemo(() => (currentChainId ? USDT_SDK_TOKEN[currentChainId] : undefined), [currentChainId]);

    const wethToken = useMemo(() => {
        if (!currentChainId || !WETH9[currentChainId as keyof typeof WETH9]) return undefined;
        return WETH9[currentChainId as keyof typeof WETH9];
    }, [currentChainId]) as Token;

    const findAndQuoteSingleLeg = useCallback(
        async (
            tIn: Token,
            tOut: Token,
            amountForLeg: CurrencyAmount<Token>,
            isExactInputLeg: boolean,
            signal?: AbortSignal
        ): Promise<{
            outputAmount?: CurrencyAmount<Token>;
            inputAmount?: CurrencyAmount<Token>;
            fee: FeeAmount;
            gasEstimate: bigint;
            poolAddress: `0x${string}`;
        } | null> => {
            if (!publicClient || !v3FactoryAddress || !v3QuoterAddress || !tIn || !tOut) return null;

            const feeTiersToTry = [FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.LOWEST, FeeAmount.HIGH];
            const [sortedA, sortedB] = tIn.sortsBefore(tOut) ? [tIn, tOut] : [tOut, tIn];

            for (const fee of feeTiersToTry) {
                if (signal?.aborted) throw new Error('Aborted');
                try {
                    const poolAddr = (await publicClient.readContract({
                        address: v3FactoryAddress,
                        abi: uniswapV3FactoryAbi,
                        functionName: 'getPool',
                        args: [sortedA.address as `0x${string}`, sortedB.address as `0x${string}`, fee],
                    })) as `0x${string}`;

                    if (poolAddr && poolAddr.toLowerCase() !== zeroAddress.toLowerCase()) {
                        if (isExactInputLeg) {
                            const quoteResult = (await publicClient.readContract({
                                address: v3QuoterAddress,
                                abi: uniswapV3QuoterV2Abi,
                                functionName: 'quoteExactInputSingle',
                                args: [
                                    {
                                        tokenIn: tIn.address as `0x${string}`,
                                        tokenOut: tOut.address as `0x${string}`,
                                        amountIn: amountForLeg.quotient,
                                        fee,
                                        sqrtPriceLimitX96: 0n,
                                    },
                                ],
                            })) as [bigint, bigint, bigint, bigint];

                            if (quoteResult[0] > 0n) {
                                return {
                                    outputAmount: CurrencyAmount.fromRawAmount(tOut, quoteResult[0].toString()),
                                    fee,
                                    gasEstimate: quoteResult[3],
                                    poolAddress: poolAddr,
                                };
                            }
                        } else {
                            const quoteResult = (await publicClient.readContract({
                                address: v3QuoterAddress,
                                abi: uniswapV3QuoterV2Abi,
                                functionName: 'quoteExactOutputSingle',
                                args: [
                                    {
                                        tokenIn: tIn.address as `0x${string}`,
                                        tokenOut: tOut.address as `0x${string}`,
                                        amount: amountForLeg.quotient,
                                        fee,
                                        sqrtPriceLimitX96: 0n,
                                    },
                                ],
                            })) as [bigint, bigint, bigint, bigint];

                            if (quoteResult[0] > 0n) {
                                return {
                                    inputAmount: CurrencyAmount.fromRawAmount(tIn, quoteResult[0].toString()),
                                    fee,
                                    gasEstimate: quoteResult[3],
                                    poolAddress: poolAddr,
                                };
                            }
                        }
                    }
                } catch (_quoteError: any) {
                    if (signal?.aborted) throw new Error('Aborted');
                }
            }
            return null;
        },
        [publicClient, v3FactoryAddress, v3QuoterAddress]
    );

    const getBestTradeForAmount = useCallback(
        async (amountRaw: string, amountType: SwapField, signal?: AbortSignal): Promise<PathfinderResult> => {
            try {
                if (
                    !currentChainId ||
                    !uiToken0 ||
                    !uiToken1 ||
                    !wethToken ||
                    !xtmToken ||
                    !usdtToken ||
                    !publicClient
                ) {
                    return { ...emptyPathfinderReturn, error: 'Pathfinder: Prerequisites not met.' };
                }
                if (!/^\d+$/.test(amountRaw) || BigInt(amountRaw) <= 0n) {
                    return { ...emptyPathfinderReturn, error: 'Pathfinder: Invalid or zero amount.' };
                }

                // uiToken0 is ALREADY the input token for the trade path, uiToken1 is ALREADY the output.
                const actualTradeInputToken = uiToken0;
                const actualTradeOutputToken = uiToken1;

                const initialLogicToken = actualTradeInputToken.isNative ? wethToken : (actualTradeInputToken as Token);
                const finalLogicToken = actualTradeOutputToken.isNative ? wethToken : (actualTradeOutputToken as Token);

                if (initialLogicToken.equals(finalLogicToken)) {
                    return { ...emptyPathfinderReturn, error: 'Pathfinder: Input and output tokens are the same.' };
                }

                let amountInToQuote: CurrencyAmount<Token> | undefined;
                let amountOutToQuote: CurrencyAmount<Token> | undefined;

                // 'ethTokenField' means the amount typed is for the "FROM" UI field, which maps to actualTradeInputToken (uiToken0).
                // 'wxtmField' means the amount typed is for the "TO" UI field, which maps to actualTradeOutputToken (uiToken1).

                const toXtm = uiToken1.name === XTM_SDK_TOKEN[currentChainId].name;
                const calcAmountOut = toXtm ? amountType === 'wxtmField' : amountType === 'ethTokenField';
                const isExactInputTrade =
                    (toXtm && amountType === 'ethTokenField') || (!toXtm && amountType === 'wxtmField');

                if (calcAmountOut) {
                    if (toXtm) {
                        amountOutToQuote = CurrencyAmount.fromRawAmount((uiToken1 as Token) || wethToken, amountRaw);
                    } else {
                        amountOutToQuote = CurrencyAmount.fromRawAmount(uiToken0 as Token, amountRaw);
                    }
                } else {
                    if (toXtm) {
                        amountInToQuote = CurrencyAmount.fromRawAmount(uiToken0 as Token, amountRaw);
                    } else {
                        amountInToQuote = CurrencyAmount.fromRawAmount((uiToken1 as Token) || wethToken, amountRaw);
                    }
                }

                const commonIntermediaries = [wethToken, usdtToken].filter(
                    (token) => token && !token.equals(initialLogicToken) && !token.equals(finalLogicToken)
                );

                const possiblePathsTokens: Token[][] = [];
                possiblePathsTokens.push([initialLogicToken, finalLogicToken]);

                for (const intermediary of commonIntermediaries) {
                    if (intermediary) {
                        possiblePathsTokens.push([initialLogicToken, intermediary, finalLogicToken]);
                    }
                }

                let bestTradePath: TradeLeg[] = [];
                let bestCalculatedInputAmount: CurrencyAmount<Token> | undefined;
                let bestCalculatedOutputAmount: CurrencyAmount<Token> | undefined;
                let bestTotalGasEstimate = 0n;

                for (const currentPathTokens of possiblePathsTokens) {
                    if (signal?.aborted) throw new Error('Aborted');
                    const currentTradeLegs: TradeLeg[] = [];
                    let currentPathInputAmount: CurrencyAmount<Token> | undefined;
                    let currentPathOutputAmount: CurrencyAmount<Token> | undefined;
                    let currentPathTotalGas = 0n;
                    let pathIsPossible = true;

                    if (isExactInputTrade && amountInToQuote) {
                        currentPathInputAmount = amountInToQuote;
                        let nextLegInputAmount = currentPathInputAmount;

                        for (let i = 0; i < currentPathTokens.length - 1; i++) {
                            const legInToken = currentPathTokens[i];
                            const legOutToken = currentPathTokens[i + 1];
                            const quote = await findAndQuoteSingleLeg(
                                legInToken,
                                legOutToken,
                                nextLegInputAmount,
                                true, // isExactInputLeg = true
                                signal
                            );

                            if (
                                !quote ||
                                !quote.outputAmount ||
                                BigInt(quote.outputAmount.quotient.toString()) === 0n
                            ) {
                                pathIsPossible = false;
                                break;
                            }
                            currentTradeLegs.push({ tokenIn: legInToken, tokenOut: legOutToken, fee: quote.fee });
                            nextLegInputAmount = quote.outputAmount;
                            currentPathTotalGas += quote.gasEstimate;
                        }
                        if (pathIsPossible) currentPathOutputAmount = nextLegInputAmount;
                    } else if (!isExactInputTrade && amountOutToQuote) {
                        // Exact output trade
                        currentPathOutputAmount = amountOutToQuote;
                        let prevLegOutputAmount = currentPathOutputAmount;

                        for (let i = currentPathTokens.length - 1; i > 0; i--) {
                            const legInToken = currentPathTokens[i - 1];
                            const legOutToken = currentPathTokens[i];
                            const quote = await findAndQuoteSingleLeg(
                                legInToken,
                                legOutToken,
                                prevLegOutputAmount,
                                false, // isExactInputLeg = false
                                signal
                            );

                            if (!quote || !quote.inputAmount || BigInt(quote.inputAmount.quotient.toString()) === 0n) {
                                pathIsPossible = false;
                                break;
                            }
                            currentTradeLegs.unshift({ tokenIn: legInToken, tokenOut: legOutToken, fee: quote.fee });
                            prevLegOutputAmount = quote.inputAmount;
                            currentPathTotalGas += quote.gasEstimate;
                        }
                        if (pathIsPossible) currentPathInputAmount = prevLegOutputAmount;
                    } else {
                        pathIsPossible = false;
                    }

                    if (pathIsPossible && currentPathInputAmount && currentPathOutputAmount) {
                        if (isExactInputTrade) {
                            if (
                                !bestCalculatedOutputAmount ||
                                currentPathOutputAmount.greaterThan(bestCalculatedOutputAmount)
                            ) {
                                bestCalculatedOutputAmount = currentPathOutputAmount;
                                bestCalculatedInputAmount = currentPathInputAmount;
                                bestTradePath = currentTradeLegs;
                                bestTotalGasEstimate = currentPathTotalGas;
                            }
                        } else {
                            if (
                                !bestCalculatedInputAmount ||
                                currentPathInputAmount.lessThan(bestCalculatedInputAmount)
                            ) {
                                bestCalculatedInputAmount = currentPathInputAmount;
                                bestCalculatedOutputAmount = currentPathOutputAmount;
                                bestTradePath = currentTradeLegs;
                                bestTotalGasEstimate = currentPathTotalGas;
                            }
                        }
                    }
                }

                if (signal?.aborted) throw new Error('Aborted');

                if (
                    bestTradePath.length === 0 ||
                    !bestCalculatedInputAmount ||
                    !bestCalculatedOutputAmount ||
                    BigInt(bestCalculatedOutputAmount.quotient.toString()) === 0n
                ) {
                    return { ...emptyPathfinderReturn, error: 'Pathfinder: No viable trade path found.' };
                }

                const finalDisplayInputAmount = CurrencyAmount.fromRawAmount(
                    actualTradeInputToken, // This is uiToken0
                    bestCalculatedInputAmount.quotient
                );
                const finalDisplayOutputAmount = CurrencyAmount.fromRawAmount(
                    actualTradeOutputToken, // This is uiToken1
                    bestCalculatedOutputAmount.quotient
                );

                const executionPrice = new Price(
                    finalDisplayInputAmount.currency,
                    finalDisplayOutputAmount.currency,
                    finalDisplayInputAmount.quotient,
                    finalDisplayOutputAmount.quotient
                );

                const oneHundredPercent = new Percent(1, 1);
                const slippageAdjustedPercent = oneHundredPercent.subtract(SLIPPAGE_TOLERANCE_PERCENT);
                const minimumReceivedRaw = bestCalculatedOutputAmount.multiply(slippageAdjustedPercent).quotient;

                const minimumReceived = CurrencyAmount.fromRawAmount(
                    finalDisplayOutputAmount.currency,
                    minimumReceivedRaw
                );

                const estimatedGasFeeNativeStr = bestTotalGasEstimate > 0n ? bestTotalGasEstimate.toString() : null;

                const tradeDetails: V3TradeDetails = {
                    inputToken: actualTradeInputToken,
                    outputToken: actualTradeOutputToken,
                    inputAmount: finalDisplayInputAmount,
                    outputAmount: finalDisplayOutputAmount,
                    minimumReceived,
                    executionPrice,
                    priceImpactPercent: null,
                    estimatedGasFeeNative: estimatedGasFeeNativeStr,
                    path: bestTradePath,
                };
                return { tradeDetails, error: null, isLoading: false };
            } catch (e: any) {
                if (signal?.aborted) {
                    return { ...emptyPathfinderReturn, isLoading: false };
                }
                return {
                    ...emptyPathfinderReturn,
                    error: e.message || 'Pathfinder: Failed to get trade details.',
                    isLoading: false,
                };
            }
        },
        [currentChainId, uiToken0, uiToken1, wethToken, xtmToken, usdtToken, findAndQuoteSingleLeg, publicClient]
    );

    return { getBestTradeForAmount };
};
