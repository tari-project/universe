import { Token, WETH9, CurrencyAmount, TradeType, Ether, NativeCurrency, Price } from '@uniswap/sdk-core';
import { InsufficientReservesError, Pair, Route, Trade } from '@uniswap/v2-sdk';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { Contract, ethers, Signer as EthersSigner, Provider, TransactionResponse, TransactionReceipt } from 'ethers';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { encodeFunctionData, formatUnits, parseUnits, PublicClient as ViemPublicClient } from 'viem';

import {
    erc20Abi,
    uniswapV2RouterAbi,
    uniswapV2PairAbi,
    ROUTER_ADDRESSES,
    XTM_SDK_TOKEN,
    KNOWN_SDK_TOKENS,
    SLIPPAGE_TOLERANCE,
    DEADLINE_MINUTES,
    SWAP_ETH_FOR_EXACT_TOKENS_ABI_VIEM,
    SWAP_EXACT_ETH_FOR_TOKENS_ABI_VIEM,
    SWAP_EXACT_TOKENS_FOR_ETH_ABI_VIEM,
    SWAP_EXACT_TOKENS_FOR_TOKENS_ABI_VIEM,
    SWAP_TOKENS_FOR_EXACT_ETH_ABI_VIEM,
    SWAP_TOKENS_FOR_EXACT_TOKENS_ABI_VIEM,
    RPC_URLS,
} from './lib/constants';
import { walletClientToSigner, retryAsync, estimateTransactionGasFees } from './lib/utils';
import { TradeDetails, SwapField, SwapDirection } from './lib/types';
import { useToastStore } from '@app/components/ToastStack/useToastStore';
import { useConfigCoreStore } from '@app/store';

export const useUniswapV2Interactions = () => {
    const [pairTokenAddress, setPairTokenAddress] = useState<`0x${string}` | null>(null);
    const [direction, setDirection] = useState<SwapDirection>('toXtm');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [insufficientLiquidity, setInsufficientLiquidity] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isFetchingPair, setIsFetchingPair] = useState(false);
    const addToast = useToastStore((s) => s.addToast);

    const { address: accountAddress, isConnected, chain } = useAccount();
    const { data: walletClient } = useWalletClient();

    const defaultChainId = useConfigCoreStore((s) => s.default_chain);
    const currentChainId = useMemo(() => chain?.id || defaultChainId, [chain?.id, defaultChainId]);
    const publicClient = usePublicClient({ chainId: currentChainId }) as ViemPublicClient;

    const routerAddress = useMemo(
        () => (currentChainId ? ROUTER_ADDRESSES[currentChainId] : undefined),
        [currentChainId]
    );
    const xtmTokenForSwap = useMemo(
        () => (currentChainId ? XTM_SDK_TOKEN[currentChainId] : undefined),
        [currentChainId]
    );
    const nativeCurrencyPriceUSD = useMemo(() => 3000, []);

    const [signer, setSigner] = useState<EthersSigner | null>(null);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!walletClient) {
                setSigner(null);
                return;
            }
            const s = await walletClientToSigner(walletClient);
            if (!cancelled) {
                setSigner(s);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [walletClient]);

    const [provider, setProvider] = useState<Provider | null>(null);
    const publicRpcProvider = useMemo(() => {
        if (!currentChainId || !RPC_URLS[currentChainId]) return null;
        if (accountAddress) return null;
        try {
            return new ethers.JsonRpcProvider(RPC_URLS[currentChainId], currentChainId);
        } catch (e) {
            console.error('Error creating public JsonRpcProvider:', e);
            return null;
        }
    }, [accountAddress, currentChainId]);

    useEffect(() => {
        setProvider(walletClient && signer?.provider ? signer.provider : publicRpcProvider);
    }, [walletClient, signer, publicRpcProvider]);

    const sdkPairTokenForSwap = useMemo(() => {
        if (!currentChainId) return undefined;
        const currentWeth = WETH9[currentChainId];
        if (pairTokenAddress === null) return currentWeth;
        const lowerCaseAddress = pairTokenAddress.toLowerCase() as `0x${string}`;
        return KNOWN_SDK_TOKENS[currentChainId]?.[lowerCaseAddress] || undefined;
    }, [pairTokenAddress, currentChainId]);

    const { sdkToken0, sdkToken1 } = useMemo(() => {
        const _sdkToken0 = direction === 'toXtm' ? sdkPairTokenForSwap : xtmTokenForSwap;
        const _sdkToken1 = direction === 'toXtm' ? xtmTokenForSwap : sdkPairTokenForSwap;
        return { sdkToken0: _sdkToken0, sdkToken1: _sdkToken1 };
    }, [sdkPairTokenForSwap, xtmTokenForSwap, direction]);

    const { token0, token1 } = useMemo(() => {
        if (!currentChainId) return { token0: undefined, token1: undefined };
        let uiInputToken: Token | NativeCurrency | undefined;
        let uiOutputToken: Token | NativeCurrency | undefined;
        let selectedPairSideTokenForSwapUi: Token | NativeCurrency | undefined;

        if (pairTokenAddress === null) {
            selectedPairSideTokenForSwapUi = Ether.onChain(currentChainId);
        } else {
            const currentWeth = WETH9[currentChainId];
            if (currentWeth && pairTokenAddress.toLowerCase() === currentWeth.address.toLowerCase()) {
                selectedPairSideTokenForSwapUi = currentWeth;
            } else {
                selectedPairSideTokenForSwapUi =
                    KNOWN_SDK_TOKENS[currentChainId]?.[pairTokenAddress.toLowerCase() as `0x${string}`];
            }
        }
        const xtmUiToken = xtmTokenForSwap;

        if (direction === 'toXtm') {
            uiInputToken = selectedPairSideTokenForSwapUi;
            uiOutputToken = xtmUiToken;
        } else {
            uiInputToken = xtmUiToken;
            uiOutputToken = selectedPairSideTokenForSwapUi;
        }
        return { token0: uiInputToken, token1: uiOutputToken };
    }, [pairTokenAddress, xtmTokenForSwap, direction, currentChainId]);

    useEffect(() => {
        setError(null);
        setInsufficientLiquidity(false);
    }, [sdkToken0, sdkToken1, pairTokenAddress, direction, currentChainId]);

    const getPair = useCallback(
        async (tokenA: Token, tokenB: Token, preview?: boolean): Promise<Pair | null> => {
            if (!tokenA || !tokenB || !provider || tokenA.chainId !== tokenB.chainId) {
                if (!preview) setError('Invalid token setup or provider for pair.');
                return null;
            }
            setIsFetchingPair(true);
            if (!preview) setError(null);

            try {
                const computedPairAddress = Pair.getAddress(tokenA, tokenB);
                const pairContract = new Contract(computedPairAddress, uniswapV2PairAbi, provider);

                const getReservesFn = () => pairContract['getReserves']();
                const reservesContext = `getPair.getReserves(${tokenA.symbol}/${tokenB.symbol})`;

                const reservesData = await retryAsync(
                    reservesContext,
                    getReservesFn,
                    3, // Max 3 attempts (1 initial + 2 retries)
                    1000, // 1s delay between retries
                    (context, err, attempt, max) => {
                        console.warn(`[${context}] Attempt ${attempt}/${max} failed:`, err.message || err);
                        // if (!preview) setTransientError(`Fetching pair info (attempt ${attempt})...`);
                    }
                );

                const [reserve0BN, reserve1BN] = [reservesData[0], reservesData[1]];
                const [sortedTokenA, sortedTokenB] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];
                const pairInstance = new Pair(
                    CurrencyAmount.fromRawAmount(sortedTokenA, reserve0BN.toString()),
                    CurrencyAmount.fromRawAmount(sortedTokenB, reserve1BN.toString())
                );

                const reserveQuotient0 = BigInt(pairInstance.reserve0.quotient.toString());
                const reserveQuotient1 = BigInt(pairInstance.reserve1.quotient.toString()); // Added for completeness

                if (reserveQuotient0 === 0n && reserveQuotient1 === 0n && !preview) {
                    setError('Pair has no liquidity.');
                }
                setIsFetchingPair(false);
                return pairInstance;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                if (!preview)
                    setError(`Failed to fetch pair for ${tokenA.symbol}-${tokenB.symbol} after retries: ${e.message}`);
                console.error(`[getPair] Final failure for ${tokenA.symbol}-${tokenB.symbol}:`, e);
                setIsFetchingPair(false);
                return null;
            }
        },
        [provider, setError, setIsFetchingPair]
    );

    const getTradeDetails = useCallback(
        async (amountRaw: string, amountType: SwapField): Promise<TradeDetails> => {
            setInsufficientLiquidity(false);
            const emptyReturn = {
                trade: null,
                route: null,
                estimatedGasFeeNative: null,
                estimatedGasFeeUSD: null,
                minimumReceived: null,
                executionPrice: null,
                priceImpactPercent: null,
            };
            if (!publicClient || !currentChainId || !sdkToken0 || !sdkToken1 || !routerAddress) {
                setError('Prerequisites for trade details not met.');
                return emptyReturn;
            }
            if (!/^\d+$/.test(amountRaw) || BigInt(amountRaw) <= 0n) {
                setError('Invalid or zero amount provided.');
                return emptyReturn;
            }

            const pair = await getPair(sdkToken0, sdkToken1, true);
            if (!pair) {
                if (!error) setError('Could not find liquidity pair for trade.');
                return emptyReturn;
            }

            let trade: Trade<Token, Token, TradeType> | null = null;
            let route: Route<Token, Token> | null = null;
            let minimumReceived: CurrencyAmount<Token | NativeCurrency> | null = null;
            let executionPrice: Price<Token | NativeCurrency, Token | NativeCurrency> | null = null;
            let priceImpactPercent: string | null = null;

            try {
                route = new Route([pair], sdkToken0, sdkToken1);
                if (amountType === 'ethTokenField') {
                    const currencyAmountIn = CurrencyAmount.fromRawAmount(sdkToken0, amountRaw);
                    trade = new Trade(route, currencyAmountIn, TradeType.EXACT_INPUT);
                } else {
                    const currencyAmountOut = CurrencyAmount.fromRawAmount(sdkToken1, amountRaw);
                    trade = new Trade(route, currencyAmountOut, TradeType.EXACT_OUTPUT);
                }
                minimumReceived = trade.minimumAmountOut(SLIPPAGE_TOLERANCE);
                executionPrice = trade.executionPrice as Price<Token | NativeCurrency, Token | NativeCurrency>;
                priceImpactPercent = trade.priceImpact.toSignificant(2);
                setError(null);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                console.error('Error creating trade object:', e);
                if (e instanceof InsufficientReservesError) {
                    setError('Insufficient liquidity for this trade.');
                    setInsufficientLiquidity(true);
                } else {
                    setError(`Error calculating trade: ${e.message || 'Unknown error'}`);
                }
                return {
                    ...emptyReturn,
                    trade,
                    route,
                    inputAmount: trade?.inputAmount,
                    outputAmount: trade?.outputAmount,
                };
            }

            if (!trade) return { ...emptyReturn, inputAmount: undefined, outputAmount: undefined };

            let estimatedGasFeeNativeStr: string | null = null;
            let estimatedGasFeeUSDStr: string | null = null;

            if (isConnected && accountAddress && publicClient && routerAddress && currentChainId) {
                const deadline = Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60;
                const path = route.path.map((t) => t.address as `0x${string}`);
                const amountIn = BigInt(trade.inputAmount.quotient.toString());
                const amountOut = BigInt(trade.outputAmount.quotient.toString());
                const amountOutParam =
                    trade.tradeType === TradeType.EXACT_INPUT
                        ? BigInt(trade.minimumAmountOut(SLIPPAGE_TOLERANCE).quotient.toString())
                        : amountOut;
                const amountInParam =
                    trade.tradeType === TradeType.EXACT_OUTPUT
                        ? BigInt(trade.maximumAmountIn(SLIPPAGE_TOLERANCE).quotient.toString())
                        : amountIn;

                let callData: `0x${string}`;
                let valueToSend: bigint | undefined = undefined;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let swapAbiForViem: any;
                let functionName: string;

                const inputIsNative = token0?.isNative;
                const outputIsNative = token1?.isNative;

                if (trade.tradeType === TradeType.EXACT_INPUT) {
                    if (inputIsNative) {
                        swapAbiForViem = SWAP_EXACT_ETH_FOR_TOKENS_ABI_VIEM;
                        functionName = 'swapExactETHForTokens';
                        callData = encodeFunctionData({
                            abi: swapAbiForViem,
                            functionName,
                            args: [amountOutParam, path, accountAddress as `0x${string}`, BigInt(deadline)],
                        });
                        valueToSend = amountInParam;
                    } else if (outputIsNative) {
                        swapAbiForViem = SWAP_EXACT_TOKENS_FOR_ETH_ABI_VIEM;
                        functionName = 'swapExactTokensForETH';
                        callData = encodeFunctionData({
                            abi: swapAbiForViem,
                            functionName,
                            args: [
                                amountInParam,
                                amountOutParam,
                                path,
                                accountAddress as `0x${string}`,
                                BigInt(deadline),
                            ],
                        });
                    } else {
                        swapAbiForViem = SWAP_EXACT_TOKENS_FOR_TOKENS_ABI_VIEM;
                        functionName = 'swapExactTokensForTokens';
                        callData = encodeFunctionData({
                            abi: swapAbiForViem,
                            functionName,
                            args: [
                                amountInParam,
                                amountOutParam,
                                path,
                                accountAddress as `0x${string}`,
                                BigInt(deadline),
                            ],
                        });
                    }
                } else {
                    // EXACT_OUTPUT
                    if (inputIsNative) {
                        swapAbiForViem = SWAP_ETH_FOR_EXACT_TOKENS_ABI_VIEM;
                        functionName = 'swapETHForExactTokens';
                        callData = encodeFunctionData({
                            abi: swapAbiForViem,
                            functionName,
                            args: [amountOutParam, path, accountAddress as `0x${string}`, BigInt(deadline)],
                        });
                        valueToSend = amountInParam;
                    } else if (outputIsNative) {
                        swapAbiForViem = SWAP_TOKENS_FOR_EXACT_ETH_ABI_VIEM;
                        functionName = 'swapTokensForExactETH';
                        callData = encodeFunctionData({
                            abi: swapAbiForViem,
                            functionName,
                            args: [
                                amountOutParam,
                                amountInParam,
                                path,
                                accountAddress as `0x${string}`,
                                BigInt(deadline),
                            ],
                        });
                    } else {
                        swapAbiForViem = SWAP_TOKENS_FOR_EXACT_TOKENS_ABI_VIEM;
                        functionName = 'swapTokensForExactTokens';
                        callData = encodeFunctionData({
                            abi: swapAbiForViem,
                            functionName,
                            args: [
                                amountOutParam,
                                amountInParam,
                                path,
                                accountAddress as `0x${string}`,
                                BigInt(deadline),
                            ],
                        });
                    }
                }

                const gasFeeDetails = await estimateTransactionGasFees({
                    publicClient,
                    accountAddress: accountAddress as `0x${string}`,
                    toAddress: routerAddress,
                    callData,
                    valueToSend,
                    nativeCurrencyPriceUSD,
                    nativeCurrencyDecimals: publicClient?.chain?.nativeCurrency.decimals || 18,
                    nativeCurrencySymbol: publicClient?.chain?.nativeCurrency.symbol || 'ETH',
                });

                estimatedGasFeeNativeStr = gasFeeDetails.estimatedGasFeeNative;
                estimatedGasFeeUSDStr = gasFeeDetails.estimatedGasFeeUSD;

                if (gasFeeDetails.error) {
                    console.warn(`Gas estimation for trade preview failed: ${gasFeeDetails.error}`);
                    if (
                        gasFeeDetails.error.includes('TransferHelper') ||
                        gasFeeDetails.error.includes('transferFrom failed')
                    ) {
                        console.warn(
                            'Gas estimation failed due to potential allowance/balance issue, will be checked at swap time.'
                        );
                        try {
                            const currentGasPrice = await publicClient.getGasPrice();
                            const formattedCurrentGasPrice = formatUnits(
                                currentGasPrice,
                                publicClient?.chain?.nativeCurrency.decimals || 18
                            );
                            estimatedGasFeeNativeStr = `${formattedCurrentGasPrice} ${publicClient?.chain?.nativeCurrency.symbol || 'ETH'}`;
                            estimatedGasFeeUSDStr = null;
                        } catch {
                            estimatedGasFeeNativeStr = 'Requires approval (Gas N/A)';
                        }
                    } else {
                        estimatedGasFeeNativeStr = 'Estimation Failed';
                    }
                }
            }

            return {
                trade,
                route,
                estimatedGasFeeNative: estimatedGasFeeNativeStr || 'N/A',
                estimatedGasFeeUSD: estimatedGasFeeUSDStr || '',
                midPrice: route.midPrice,
                inputAmount: trade.inputAmount,
                outputAmount: trade.outputAmount,
                minimumReceived,
                executionPrice,
                priceImpactPercent,
            };
        },
        [
            publicClient,
            currentChainId,
            sdkToken0,
            sdkToken1,
            token0,
            token1,
            routerAddress,
            getPair,
            isConnected,
            accountAddress,
            error,
            nativeCurrencyPriceUSD,
            setError,
            setInsufficientLiquidity,
        ]
    );

    // ---------- Approval (Generic) ----------
    const checkAndRequestApproval = useCallback(
        async (
            tokenToApprove: Token,
            amountToApproveRaw: string,
            spenderAddress?: `0x${string}`
        ): Promise<TransactionReceipt | null> => {
            const spender = spenderAddress || routerAddress;
            if (!accountAddress || !spender || !currentChainId || tokenToApprove.isNative || !signer) {
                setError('Approval prerequisites not met or native token.');
                return null;
            }
            setIsApproving(true);
            setError(null);
            let receipt: TransactionReceipt | null = null;
            try {
                const tokenContract = new Contract(tokenToApprove.address, erc20Abi, signer);
                const amountToApproveBI = BigInt(amountToApproveRaw);

                const currentAllowance = BigInt((await tokenContract.allowance(accountAddress, spender)).toString());

                if (currentAllowance < amountToApproveBI) {
                    const approveTx = await tokenContract.approve(spender, amountToApproveBI);
                    receipt = (await approveTx.wait(1)) as TransactionReceipt; // wait for 1 confirmation
                    if (receipt?.status !== 1) throw new Error('Approval transaction failed on-chain.');
                }
                setIsApproving(false);
                return receipt;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                console.error('Error during approval:', e);
                const message = e?.reason || e?.data?.message || e?.message || 'User rejected or approval failed.';
                setError(`Approval failed: ${message}`);
                setIsApproving(false);
                return null;
            }
        },
        [signer, accountAddress, routerAddress, currentChainId, setError, setIsApproving]
    );

    // ---------- Swap Execution (for SWAPPING) ----------
    const executeSwap = useCallback(
        async (
            tradeToExecute: Trade<Token, Token, TradeType>
        ): Promise<{ response: TransactionResponse; receipt: TransactionReceipt } | null> => {
            setError(null);
            setIsLoading(true);
            if (
                !signer ||
                !accountAddress ||
                !isConnected ||
                !routerAddress ||
                !currentChainId ||
                !tradeToExecute ||
                !sdkToken0 ||
                !sdkToken1
            ) {
                setError('Swap prerequisites not met for execution.');
                setIsLoading(false);
                return null;
            }

            try {
                if (!sdkToken0.isNative) {
                    const approvalReceipt = await checkAndRequestApproval(
                        sdkToken0,
                        tradeToExecute.inputAmount.quotient.toString()
                    );
                    // Check if approval was needed AND failed, or if allowance is still insufficient
                    const tokenContract = new Contract(sdkToken0.address, erc20Abi, signer); // Re-check allowance
                    const currentAllowance = BigInt(
                        (await tokenContract.allowance(accountAddress, routerAddress)).toString()
                    );
                    if (currentAllowance < BigInt(tradeToExecute.inputAmount.quotient.toString())) {
                        setIsLoading(false);
                        if (!approvalReceipt || approvalReceipt.status !== 1) {
                            // If approval tx failed or wasn't needed but still no allowance
                            setError('Approval failed or is insufficient.');
                        }
                        return null;
                    }
                }

                const amountIn = BigInt(tradeToExecute.inputAmount.quotient.toString());
                const amountOutMinOrExact =
                    tradeToExecute.tradeType === TradeType.EXACT_INPUT
                        ? BigInt(tradeToExecute.minimumAmountOut(SLIPPAGE_TOLERANCE).quotient.toString())
                        : BigInt(tradeToExecute.outputAmount.quotient.toString());

                const amountInMaxOrExact =
                    tradeToExecute.tradeType === TradeType.EXACT_OUTPUT
                        ? BigInt(tradeToExecute.maximumAmountIn(SLIPPAGE_TOLERANCE).quotient.toString())
                        : amountIn;

                const path = tradeToExecute.route.path.map((t) => t.address as `0x${string}`);
                const to = accountAddress as `0x${string}`;
                const deadline = Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60;

                const inputIsNativeForRouter = token0?.isNative;
                const outputIsNativeForRouter = token1?.isNative;

                const routerContract = new Contract(routerAddress, uniswapV2RouterAbi, signer);
                const txOptions: { value?: bigint; gasLimit?: bigint } = {};
                let methodName: string;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let methodArgs: any[];

                // ... (methodName, methodArgs, txOptions.value logic - unchanged)
                if (tradeToExecute.tradeType === TradeType.EXACT_INPUT) {
                    if (inputIsNativeForRouter) {
                        methodName = 'swapExactETHForTokens';
                        methodArgs = [amountOutMinOrExact, path, to, deadline];
                        txOptions.value = amountInMaxOrExact;
                    } else if (outputIsNativeForRouter) {
                        methodName = 'swapExactTokensForETH';
                        methodArgs = [amountInMaxOrExact, amountOutMinOrExact, path, to, deadline];
                    } else {
                        methodName = 'swapExactTokensForTokens';
                        methodArgs = [amountInMaxOrExact, amountOutMinOrExact, path, to, deadline];
                    }
                } else {
                    // EXACT_OUTPUT
                    if (inputIsNativeForRouter) {
                        methodName = 'swapETHForExactTokens';
                        methodArgs = [amountOutMinOrExact, path, to, deadline];
                        txOptions.value = amountInMaxOrExact;
                    } else if (outputIsNativeForRouter) {
                        methodName = 'swapTokensForExactETH';
                        methodArgs = [amountOutMinOrExact, amountInMaxOrExact, path, to, deadline];
                    } else {
                        methodName = 'swapTokensForExactTokens';
                        methodArgs = [amountOutMinOrExact, amountInMaxOrExact, path, to, deadline];
                    }
                }

                try {
                    // Gas estimation for the actual send transaction
                    const estimateGasForSendFn = () => routerContract[methodName].estimateGas(...methodArgs, txOptions);
                    const estimateGasContext = `executeSwap.estimateGas.${methodName}`;
                    const estimatedGas = await retryAsync(
                        estimateGasContext,
                        estimateGasForSendFn,
                        2,
                        500,
                        (ctx, err, att, max) => console.warn(`[${ctx}] Attempt ${att}/${max} failed:`, err.message)
                    );
                    txOptions.gasLimit = (estimatedGas * 120n) / 100n; // Add 20% buffer
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (gasError: any) {
                    console.warn('Gas estimation failed for executeSwap (final attempt):', gasError.message);
                }

                const swapTxResponse = await routerContract[methodName](...methodArgs, txOptions);
                const swapTxReceipt = (await swapTxResponse.wait(1)) as TransactionReceipt;
                setIsLoading(false);

                if (swapTxReceipt?.status !== 1) {
                    throw new Error('Swap transaction failed on-chain.');
                }
                return { response: swapTxResponse, receipt: swapTxReceipt };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                console.error('Error executing swap transaction:', error);
                const reason = error?.reason || error?.data?.message || error?.message || 'Unknown swap error.';
                setError(`Swap failed: ${reason}`);
                setIsLoading(false);
                return null;
            }
        },
        [
            signer,
            accountAddress,
            isConnected,
            routerAddress,
            currentChainId,
            sdkToken0,
            sdkToken1,
            token0,
            token1,
            checkAndRequestApproval,
            setError,
            setIsLoading,
        ]
    );

    // Liquidity Management functions (addLiquidity, removeAllLiquidity)
    const addLiquidity = useCallback(
        async (params: {
            tokenA: Token;
            tokenB: Token | NativeCurrency;
            amountADesired: number;
            amountBDesired?: number;
        }): Promise<{ response: TransactionResponse; receipt: TransactionReceipt } | null> => {
            const { tokenA, tokenB, amountADesired, amountBDesired } = params;
            if (!accountAddress || !signer || !currentChainId || !routerAddress) {
                addToast({ title: 'Error', text: 'Prerequisites for adding liquidity not met.', type: 'error' });
                return null;
            }
            if (amountADesired <= 0) {
                addToast({ title: 'Input Error', text: `Amount for ${tokenA.symbol} must be > 0.`, type: 'error' });
                return null;
            }
            if (amountBDesired !== undefined && amountBDesired <= 0 && !tokenB.isNative) {
                addToast({
                    title: 'Input Error',
                    text: `Amount for ${tokenB.symbol} must be > 0 or not provided.`,
                    type: 'error',
                });
                return null;
            }

            setIsLoading(true);
            addToast({ title: 'Processing', text: 'Preparing to add liquidity...', type: 'info' });

            try {
                const amountADesiredBigInt = parseUnits(amountADesired.toString(), tokenA.decimals);
                let amountBDesiredBigInt: bigint;

                const wethForChain = WETH9[currentChainId];
                const tokenBIsNativeForRouter = tokenB.isNative || (wethForChain && tokenB.equals(wethForChain));
                const actualTokenBForSdk = tokenB.isNative ? wethForChain : (tokenB as Token);

                if (!actualTokenBForSdk) {
                    addToast({
                        title: 'Config Error',
                        text: `WETH not configured for chain ${currentChainId} when native currency is used.`,
                        type: 'error',
                    });
                    setIsLoading(false);
                    return null;
                }

                // If amountBDesired is not provided or zero, calculate it based on pool ratio
                if (amountBDesired === undefined || amountBDesired <= 0) {
                    const pair = await getPair(tokenA, actualTokenBForSdk);
                    if (!pair) {
                        addToast({
                            title: 'Pair Error',
                            text: 'Could not find liquidity pair. If new, provide both amounts.',
                            type: 'info',
                        });
                        setIsLoading(false);
                        return null;
                    }
                    const reserveA = pair.reserveOf(tokenA);
                    const reserveB = pair.reserveOf(actualTokenBForSdk);
                    const quotientA = BigInt(reserveA.quotient.toString());
                    const quotientB = BigInt(reserveB.quotient.toString());

                    if (quotientA === 0n || quotientB === 0n) {
                        addToast({
                            title: 'Info',
                            text: 'Pool is new or one side has no liquidity. Please provide both token amounts.',
                            type: 'info',
                        });
                        setIsLoading(false);
                        return null;
                    }
                    amountBDesiredBigInt = (amountADesiredBigInt * quotientB) / quotientA;
                    addToast({
                        title: 'Info',
                        text: `Calculated ${actualTokenBForSdk.symbol}: ${formatUnits(amountBDesiredBigInt, actualTokenBForSdk.decimals)}`,
                        type: 'info',
                    });
                } else {
                    amountBDesiredBigInt = parseUnits(amountBDesired.toString(), actualTokenBForSdk.decimals);
                }

                const approvalAReceipt = await checkAndRequestApproval(tokenA, amountADesiredBigInt.toString());
                const tokenAContract = new Contract(tokenA.address, erc20Abi, signer);
                if (
                    BigInt((await tokenAContract.allowance(accountAddress, routerAddress)).toString()) <
                    amountADesiredBigInt
                ) {
                    setIsLoading(false);
                    if (!approvalAReceipt || approvalAReceipt.status !== 1) {
                        setError('Approval for Token A failed or is insufficient.');
                        addToast({
                            title: 'Error',
                            text: 'Approval for Token A failed or is insufficient.',
                            type: 'error',
                        });
                    }
                    return null;
                }

                if (!tokenBIsNativeForRouter) {
                    const approvalBReceipt = await checkAndRequestApproval(
                        actualTokenBForSdk,
                        amountBDesiredBigInt.toString()
                    );
                    const tokenBContract = new Contract(actualTokenBForSdk.address, erc20Abi, signer);
                    if (
                        BigInt((await tokenBContract.allowance(accountAddress, routerAddress)).toString()) <
                        amountBDesiredBigInt
                    ) {
                        setIsLoading(false);
                        if (!approvalBReceipt || approvalBReceipt.status !== 1) {
                            setError('Approval for Token B failed or is insufficient.');
                            addToast({
                                title: 'Error',
                                text: 'Approval for Token B failed or is insufficient.',
                                type: 'error',
                            });
                        }
                        return null;
                    }
                }

                const deadline = Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60;
                const slippageNumerator = BigInt(SLIPPAGE_TOLERANCE.numerator.toString());
                const slippageDenominator = BigInt(SLIPPAGE_TOLERANCE.denominator.toString());

                const amountAMin =
                    (amountADesiredBigInt * (slippageDenominator - slippageNumerator)) / slippageDenominator;
                const amountBMin =
                    (amountBDesiredBigInt * (slippageDenominator - slippageNumerator)) / slippageDenominator;

                const routerContract = new Contract(routerAddress, uniswapV2RouterAbi, signer);
                let addLiqTx: TransactionResponse;

                // Consider adding gas estimation with retry here too, similar to executeSwap
                // For brevity, skipping detailed gas estimation + retry implementation here for addLiquidity

                if (tokenBIsNativeForRouter) {
                    addLiqTx = await routerContract.addLiquidityETH(
                        tokenA.address,
                        amountADesiredBigInt,
                        amountAMin,
                        amountBMin,
                        accountAddress,
                        deadline,
                        { value: amountBDesiredBigInt }
                    );
                } else {
                    addLiqTx = await routerContract.addLiquidity(
                        tokenA.address,
                        actualTokenBForSdk.address,
                        amountADesiredBigInt,
                        amountBDesiredBigInt,
                        amountAMin,
                        amountBMin,
                        accountAddress,
                        deadline
                    );
                }

                addToast({
                    title: 'Processing',
                    text: `Adding liquidity... Tx: ${addLiqTx.hash.substring(0, 10)}...`,
                    type: 'info',
                });
                const receipt = (await addLiqTx.wait(1)) as TransactionReceipt;

                if (receipt?.status === 1) {
                    addToast({ title: 'Success', text: 'Liquidity Added Successfully!', type: 'success' });
                    return { response: addLiqTx, receipt };
                } else {
                    throw new Error('Add liquidity transaction failed on-chain.');
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                console.error('Error adding liquidity:', e);
                const message = e?.data?.message || e?.reason || e?.message || 'Failed to add liquidity.';
                addToast({ title: 'Error', text: message, type: 'error' });
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [
            accountAddress,
            signer,
            currentChainId,
            routerAddress,
            getPair,
            checkAndRequestApproval,
            addToast,
            setIsLoading,
        ]
    );

    const removeAllLiquidity = useCallback(
        async (
            tokenA: Token,
            tokenB: Token | NativeCurrency
        ): Promise<{ response: TransactionResponse; receipt: TransactionReceipt } | null> => {
            addToast({ title: 'Starting Removal', text: 'Initiating liquidity removal...', type: 'info' });
            setIsLoading(true);

            if (!accountAddress || !signer || !currentChainId || !routerAddress) {
                addToast({ title: 'Error', text: 'Prerequisites not met for removing liquidity.', type: 'error' });
                setIsLoading(false);
                return null;
            }

            const wethForChain = WETH9[currentChainId];
            const tokenBIsNativeForRouter = tokenB.isNative || (wethForChain && tokenB.equals(wethForChain));
            const actualTokenBForSdk = tokenB.isNative ? wethForChain : (tokenB as Token);

            if (!actualTokenBForSdk) {
                addToast({
                    title: 'Config Error',
                    text: `WETH not configured for chain ${currentChainId} when native currency is used.`,
                    type: 'error',
                });
                setIsLoading(false);
                return null;
            }

            let lpTokenAddress: `0x${string}`;
            try {
                lpTokenAddress = Pair.getAddress(tokenA, actualTokenBForSdk) as `0x${string}`;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                addToast({ title: 'SDK Error', text: `Could not calculate pair address: ${e.message}`, type: 'error' });
                setIsLoading(false);
                return null;
            }

            try {
                const lpTokenContractEthers = new Contract(lpTokenAddress, erc20Abi, signer.provider || signer);
                const getBalanceFn = () => lpTokenContractEthers.balanceOf(accountAddress);
                const balanceContext = `removeAllLiquidity.balanceOf.${lpTokenAddress.slice(0, 6)}`;
                const userLpBalanceRaw = await retryAsync(balanceContext, getBalanceFn, 3, 500, (ctx, err, att, max) =>
                    console.warn(`[${ctx}] Attempt ${att}/${max} failed:`, err.message)
                );
                const userLpBalanceBigInt = BigInt(userLpBalanceRaw.toString());

                if (userLpBalanceBigInt === 0n) {
                    addToast({ title: 'Info', text: 'You have no liquidity in this pool to remove.', type: 'info' });
                    setIsLoading(false);
                    return null;
                }
                addToast({
                    title: 'Info',
                    text: `Found ${formatUnits(userLpBalanceBigInt, 18)} LP tokens. Attempting to remove all.`,
                    type: 'info',
                });

                const lpTokenForApproval = new Token(currentChainId, lpTokenAddress, 18, 'LP', 'V2 LP Token');
                const approvalReceipt = await checkAndRequestApproval(
                    lpTokenForApproval,
                    userLpBalanceBigInt.toString()
                );
                const lpTokenContractForAllowanceCheck = new Contract(lpTokenForApproval.address, erc20Abi, signer);
                if (
                    BigInt(
                        (await lpTokenContractForAllowanceCheck.allowance(accountAddress, routerAddress)).toString()
                    ) < userLpBalanceBigInt
                ) {
                    setIsLoading(false);
                    if (!approvalReceipt || approvalReceipt.status !== 1) {
                        setError('Approval for LP Token failed or is insufficient.');
                        addToast({
                            title: 'Error',
                            text: 'Approval for LP Token failed or is insufficient.',
                            type: 'error',
                        });
                    }
                    return null;
                }

                const amountTokenAMin = 1n;
                const amountTokenBMin = 1n;
                const deadline = Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60;

                addToast({ title: 'Action Required', text: 'Please confirm removing all liquidity.', type: 'info' });
                const routerContract = new Contract(routerAddress, uniswapV2RouterAbi, signer);
                let removeTx: TransactionResponse;

                // Consider adding gas estimation with retry here too

                if (tokenBIsNativeForRouter) {
                    removeTx = await routerContract.removeLiquidityETH(
                        tokenA.address,
                        userLpBalanceBigInt,
                        amountTokenAMin,
                        amountTokenBMin,
                        accountAddress,
                        deadline
                    );
                } else {
                    removeTx = await routerContract.removeLiquidity(
                        tokenA.address,
                        actualTokenBForSdk.address,
                        userLpBalanceBigInt,
                        amountTokenAMin,
                        amountTokenBMin,
                        accountAddress,
                        deadline
                    );
                }

                addToast({
                    title: 'Processing',
                    text: `Removing liquidity... Tx: ${removeTx.hash.substring(0, 10)}...`,
                    type: 'info',
                });
                const receipt = (await removeTx.wait(1)) as TransactionReceipt;

                if (receipt?.status === 1) {
                    addToast({ title: 'Success', text: 'All liquidity removed successfully!', type: 'success' });
                    return { response: removeTx, receipt };
                } else {
                    throw new Error('Remove liquidity transaction failed on-chain.');
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                console.error('[RemoveLiq] Error:', e);
                const reason = e?.data?.message || e?.reason || e?.shortMessage || e?.message || 'Unknown error.';
                addToast({ title: 'Error', text: `Removal failed: ${reason}`, type: 'error' });
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [accountAddress, signer, currentChainId, routerAddress, addToast, checkAndRequestApproval, setIsLoading]
    );

    return {
        pairTokenAddress,
        direction,
        setPairTokenAddress,
        setDirection,
        token0,
        token1,
        sdkToken0,
        sdkToken1,
        isLoading: isLoading || isApproving || isFetchingPair,
        isApproving,
        isFetchingPair,
        error,
        insufficientLiquidity,
        routerAddress,
        getPair,
        checkAndRequestApproval,
        getTradeDetails,
        executeSwap,
        addLiquidity,
        removeAllLiquidity,
        isReady: !!signer && !!accountAddress && isConnected && !!routerAddress && !!publicClient && !!currentChainId,
    };
};
