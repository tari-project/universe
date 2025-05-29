import { Token, WETH9, CurrencyAmount, Ether, NativeCurrency, Price, Percent } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';
import { usePublicClient } from 'wagmi';
import { PublicClient as ViemPublicClient, zeroAddress } from 'viem';
import { useCallback, useMemo } from 'react';

import {
    uniswapV3QuoterV2Abi,
    QUOTER_ADDRESSES_V3,
    FACTORY_ADDRESSES_V3,
    uniswapV3FactoryAbi,
    uniswapV3PoolAbi,
    USDT_SDK_TOKEN,
    XTM_SDK_TOKEN,
    SLIPPAGE_TOLERANCE,
} from './lib/constants'; // Assuming constants are correctly set up
import { V3TradeDetails, SwapField, TradeLeg } from './lib/types';

interface UseUniswapV3PathfinderArgs {
    currentChainId: number | undefined;
    uiToken0: Token | NativeCurrency | undefined; // Token corresponding to the 'from' field in UI
    uiToken1: Token | NativeCurrency | undefined; // Token corresponding to the 'to' field in UI
}

interface PathfinderResult {
    tradeDetails: V3TradeDetails | null;
    error: string | null;
    isLoading: boolean; // You'll need to manage this state outside if needed
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
    const wethToken = useMemo(
        () => (currentChainId ? WETH9[currentChainId as keyof typeof WETH9] : undefined),
        [currentChainId]
    );

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
            poolAddress: `0x${string}`; // Return pool address for debugging
        } | null> => {
            if (!publicClient || !v3FactoryAddress || !v3QuoterAddress) return null;

            // Try fee tiers in a more common order, or allow specific overrides per pair type
            const feeTiersToTry = [FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.LOWEST, FeeAmount.HIGH]; // Example: 0.05%, 0.3%, 0.01%, 1%
            const [sortedA, sortedB] = tIn.sortsBefore(tOut) ? [tIn, tOut] : [tOut, tIn];

            for (const fee of feeTiersToTry) {
                if (signal?.aborted) throw new Error('Aborted');
                const poolAddr = (await publicClient.readContract({
                    address: v3FactoryAddress,
                    abi: uniswapV3FactoryAbi,
                    functionName: 'getPool',
                    args: [sortedA.address as `0x${string}`, sortedB.address as `0x${string}`, fee],
                })) as `0x${string}`;

                if (poolAddr && poolAddr.toLowerCase() !== zeroAddress.toLowerCase()) {
                    const liquidity = (await publicClient.readContract({
                        address: poolAddr,
                        abi: uniswapV3PoolAbi,
                        functionName: 'liquidity',
                    })) as bigint;

                    if (liquidity > 0n) {
                        // Pool exists and has some liquidity registered
                        try {
                            if (isExactInputLeg) {
                                const quoteResult = (await publicClient.readContract({
                                    address: v3QuoterAddress,
                                    abi: uniswapV3QuoterV2Abi,
                                    functionName: 'quoteExactInputSingle',
                                    args: [
                                        {
                                            tokenIn: tIn.address as `0x${string}`,
                                            tokenOut: tOut.address as `0x${string}`,
                                            fee,
                                            amountIn: amountForLeg.quotient,
                                            sqrtPriceLimitX96: 0n,
                                        },
                                    ],
                                })) as [bigint, bigint, bigint, bigint];

                                if (quoteResult[0] > 0n) {
                                    // Amount Out > 0
                                    return {
                                        outputAmount: CurrencyAmount.fromRawAmount(tOut, quoteResult[0].toString()),
                                        fee,
                                        gasEstimate: quoteResult[3],
                                        poolAddress: poolAddr,
                                    };
                                }
                            } else {
                                // Exact Output
                                const quoteResult = (await publicClient.readContract({
                                    address: v3QuoterAddress,
                                    abi: uniswapV3QuoterV2Abi,
                                    functionName: 'quoteExactOutputSingle',
                                    args: [
                                        {
                                            tokenIn: tIn.address as `0x${string}`,
                                            tokenOut: tOut.address as `0x${string}`,
                                            fee,
                                            amount: amountForLeg.quotient,
                                            sqrtPriceLimitX96: 0n,
                                        },
                                    ],
                                })) as [bigint, bigint, bigint, bigint];
                                if (quoteResult[0] > 0n) {
                                    // Amount In > 0
                                    return {
                                        inputAmount: CurrencyAmount.fromRawAmount(tIn, quoteResult[0].toString()),
                                        fee,
                                        gasEstimate: quoteResult[3],
                                        poolAddress: poolAddr,
                                    };
                                }
                            }
                            console.warn(
                                `Pathfinder: Quoted zero amount for ${tIn.symbol}->${tOut.symbol} (Pool: ${poolAddr}, Fee: ${fee})`
                            );
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        } catch (quoteError: any) {
                            // Quoter can revert if pool is created but has no initialized ticks for the range, or other issues
                            console.warn(
                                `Pathfinder: Quoting ${tIn.symbol}->${tOut.symbol} (Pool: ${poolAddr}, Fee: ${fee}) failed:`,
                                quoteError.shortMessage || quoteError.message
                            );
                        }
                    }
                }
            }
            return null; // No suitable liquid pool found for this leg with any tried fee tier
        },
        [publicClient, v3FactoryAddress, v3QuoterAddress]
    );

    const getBestTradeForAmount = useCallback(
        async (amountRaw: string, amountType: SwapField, signal?: AbortSignal): Promise<PathfinderResult> => {
            try {
                if (!currentChainId || !uiToken0 || !uiToken1 || !wethToken || !xtmToken || !usdtToken) {
                    return { ...emptyPathfinderReturn, error: 'Pathfinder: Prerequisites not met.' };
                }
                if (!/^\d+$/.test(amountRaw) || BigInt(amountRaw) <= 0n) {
                    return { ...emptyPathfinderReturn, error: 'Pathfinder: Invalid or zero amount.' };
                }

                const initialInputTokenLogic = uiToken0.isNative ? wethToken : (uiToken0 as Token);
                const finalOutputTokenLogic = uiToken1.isNative ? wethToken : (uiToken1 as Token);

                let currentAmountInForQuoting: CurrencyAmount<Token>;
                let desiredAmountOutForQuoting: CurrencyAmount<Token>;

                if (amountType === 'ethTokenField') {
                    currentAmountInForQuoting = CurrencyAmount.fromRawAmount(initialInputTokenLogic, amountRaw);
                    desiredAmountOutForQuoting = CurrencyAmount.fromRawAmount(finalOutputTokenLogic, '0');
                } else {
                    desiredAmountOutForQuoting = CurrencyAmount.fromRawAmount(finalOutputTokenLogic, amountRaw);
                    currentAmountInForQuoting = CurrencyAmount.fromRawAmount(initialInputTokenLogic, '0');
                }

                const possiblePaths: Token[][] = [];
                possiblePaths.push([initialInputTokenLogic, finalOutputTokenLogic]);

                if (
                    !initialInputTokenLogic.equals(wethToken) &&
                    !finalOutputTokenLogic.equals(wethToken) &&
                    !initialInputTokenLogic.equals(finalOutputTokenLogic)
                ) {
                    possiblePaths.push([initialInputTokenLogic, wethToken, finalOutputTokenLogic]);
                }
                if (
                    (initialInputTokenLogic.equals(xtmToken) && finalOutputTokenLogic.equals(wethToken)) ||
                    (initialInputTokenLogic.equals(wethToken) && finalOutputTokenLogic.equals(xtmToken))
                ) {
                    possiblePaths.push([initialInputTokenLogic, usdtToken, finalOutputTokenLogic]);
                }
                if (
                    (initialInputTokenLogic.equals(usdtToken) && finalOutputTokenLogic.equals(wethToken)) ||
                    (initialInputTokenLogic.equals(wethToken) && finalOutputTokenLogic.equals(usdtToken))
                ) {
                    // This case is covered by the generic WETH hop if initial/final are not WETH
                }

                let bestTradePath: TradeLeg[] = [];
                let bestFinalOutputAmount: CurrencyAmount<Token> | undefined;
                let bestFinalInputAmount: CurrencyAmount<Token> | undefined;
                let bestTotalGasEstimate = 0n;

                for (const path of possiblePaths) {
                    if (signal?.aborted) throw new Error('Aborted');
                    const currentPathLegs: TradeLeg[] = [];
                    let pathOutputAmount: CurrencyAmount<Token> | undefined;
                    let pathInputAmount: CurrencyAmount<Token> | undefined;
                    let pathTotalGas = 0n;
                    let possible = true;

                    if (amountType === 'ethTokenField') {
                        pathInputAmount = currentAmountInForQuoting;
                        let amountForNextLeg = pathInputAmount;
                        for (let i = 0; i < path.length - 1; i++) {
                            const legIn = path[i];
                            const legOut = path[i + 1];
                            const quote = await findAndQuoteSingleLeg(legIn, legOut, amountForNextLeg, true, signal);
                            console.info(
                                `Pathfinder DEBUG: Leg ${legIn.symbol}->${legOut.symbol} (Fee: ${quote?.fee}), Input: ${amountForNextLeg.toSignificant(6)}, Quote Output: ${quote?.outputAmount?.toSignificant(6) || 'N/A'}, Pool: ${quote?.poolAddress}`
                            );

                            if (
                                !quote ||
                                !quote.outputAmount ||
                                BigInt(quote.outputAmount.quotient.toString()) === 0n
                            ) {
                                possible = false;
                                break;
                            }
                            currentPathLegs.push({ tokenIn: legIn, tokenOut: legOut, fee: quote.fee });
                            amountForNextLeg = quote.outputAmount;
                            pathTotalGas += quote.gasEstimate;
                        }
                        if (possible) pathOutputAmount = amountForNextLeg;
                    } else {
                        // Exact Output
                        pathOutputAmount = desiredAmountOutForQuoting;
                        let amountForPreviousLeg = pathOutputAmount;
                        for (let i = path.length - 1; i > 0; i--) {
                            const legIn = path[i - 1];
                            const legOut = path[i];
                            const quote = await findAndQuoteSingleLeg(
                                legIn,
                                legOut,
                                amountForPreviousLeg,
                                false,
                                signal
                            );
                            if (!quote || !quote.inputAmount || BigInt(quote.inputAmount.quotient.toString()) === 0n) {
                                possible = false;
                                break;
                            }
                            currentPathLegs.unshift({ tokenIn: legIn, tokenOut: legOut, fee: quote.fee });
                            amountForPreviousLeg = quote.inputAmount;
                            pathTotalGas += quote.gasEstimate;
                        }
                        if (possible) pathInputAmount = amountForPreviousLeg;
                    }

                    if (possible && pathInputAmount && pathOutputAmount) {
                        if (amountType === 'ethTokenField') {
                            if (!bestFinalOutputAmount || pathOutputAmount.greaterThan(bestFinalOutputAmount)) {
                                bestFinalOutputAmount = pathOutputAmount;
                                bestFinalInputAmount = pathInputAmount;
                                bestTradePath = currentPathLegs;
                                bestTotalGasEstimate = pathTotalGas;
                            }
                        } else {
                            // Exact Output
                            if (!bestFinalInputAmount || pathInputAmount.lessThan(bestFinalInputAmount)) {
                                bestFinalInputAmount = pathInputAmount;
                                bestFinalOutputAmount = pathOutputAmount;
                                bestTradePath = currentPathLegs;
                                bestTotalGasEstimate = pathTotalGas;
                            }
                        }
                    }
                }

                if (signal?.aborted) throw new Error('Aborted');

                if (
                    bestTradePath.length === 0 ||
                    !bestFinalInputAmount ||
                    !bestFinalOutputAmount ||
                    BigInt(bestFinalOutputAmount.quotient.toString()) === 0n
                ) {
                    return { ...emptyPathfinderReturn, error: 'Pathfinder: No viable trade path found.' };
                }

                const displayInputAmount = uiToken0.isNative
                    ? CurrencyAmount.fromRawAmount(
                          Ether.onChain(currentChainId),
                          bestFinalInputAmount.quotient.toString()
                      )
                    : bestFinalInputAmount;
                const displayOutputAmount = uiToken1.isNative
                    ? CurrencyAmount.fromRawAmount(
                          Ether.onChain(currentChainId),
                          bestFinalOutputAmount.quotient.toString()
                      )
                    : bestFinalOutputAmount;

                const executionPrice = new Price(
                    displayInputAmount.currency,
                    displayOutputAmount.currency,
                    displayInputAmount.quotient,
                    displayOutputAmount.quotient
                );
                const minimumReceived = CurrencyAmount.fromRawAmount(
                    bestFinalOutputAmount.currency,
                    new Percent(bestFinalOutputAmount.quotient, 1)
                        .multiply(SLIPPAGE_TOLERANCE.invert())
                        .quotient.toString()
                );
                const estimatedGasFeeNativeStr =
                    bestTotalGasEstimate > 0n ? `${bestTotalGasEstimate.toString()} (gas units est.)` : null;

                const tradeDetails: V3TradeDetails = {
                    inputToken: uiToken0,
                    outputToken: uiToken1,
                    inputAmount: displayInputAmount,
                    outputAmount: displayOutputAmount,
                    minimumReceived,
                    executionPrice,
                    priceImpactPercent: null,
                    estimatedGasFeeNative: estimatedGasFeeNativeStr,
                    path: bestTradePath,
                };
                return { tradeDetails, error: null, isLoading: false };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                if (e.message === 'Aborted') {
                    return { ...emptyPathfinderReturn, isLoading: false };
                }
                console.error('Pathfinder: Error in getBestTradeForAmount:', e);
                return {
                    ...emptyPathfinderReturn,
                    error: e.message || 'Pathfinder: Failed to get trade details.',
                    isLoading: false,
                };
            }
        },
        [currentChainId, uiToken0, uiToken1, wethToken, xtmToken, usdtToken, findAndQuoteSingleLeg]
    );

    return { getBestTradeForAmount };
};
