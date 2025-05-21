import { Token, WETH9, CurrencyAmount, TradeType, Ether, NativeCurrency } from '@uniswap/sdk-core';
import { InsufficientReservesError, Pair, Route, Trade } from '@uniswap/v2-sdk';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { Contract, ethers, Signer as EthersSigner, Provider, TransactionResponse } from 'ethers';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { encodeFunctionData, formatUnits, parseUnits } from 'viem';

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
    PUBLIC_RPC_URLS,
} from './lib/constants';
import { walletClientToSigner, formatNativeGasFee, formatGasFeeUSD } from './lib/utils';
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
    const publicClient = usePublicClient({ chainId: currentChainId });

    const routerAddress = useMemo(
        () => (currentChainId ? ROUTER_ADDRESSES[currentChainId] : undefined),
        [currentChainId]
    );
    const xtmToken = useMemo(() => (currentChainId ? XTM_SDK_TOKEN[currentChainId] : undefined), [currentChainId]);
    const nativeCurrencyPriceUSD = useMemo(() => 3000, []);

    // ---------- Singer and Provider ----------

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
        if (!currentChainId || !PUBLIC_RPC_URLS[currentChainId]) return null;
        if (accountAddress) return null;
        try {
            return new ethers.JsonRpcProvider(PUBLIC_RPC_URLS[currentChainId], currentChainId);
        } catch (e) {
            console.error('Error creating public JsonRpcProvider:', e);
            return null;
        }
    }, [accountAddress, currentChainId]);

    useEffect(() => {
        setProvider(walletClient && signer?.provider ? signer.provider : publicRpcProvider);
    }, [walletClient, signer, publicRpcProvider]);

    // ---------- Pair Token ----------
    const sdkPairToken = useMemo(() => {
        if (!currentChainId) return undefined;
        const currentWeth = WETH9[currentChainId];
        if (pairTokenAddress === null) return currentWeth;
        const lowerCaseAddress = pairTokenAddress.toLowerCase() as `0x${string}`;
        return KNOWN_SDK_TOKENS[currentChainId]?.[lowerCaseAddress] || undefined;
    }, [pairTokenAddress, currentChainId]);

    const { sdkToken0, sdkToken1 } = useMemo(() => {
        const _sdkToken0 = direction === 'toXtm' ? sdkPairToken : xtmToken;
        const _sdkToken1 = direction === 'toXtm' ? xtmToken : sdkPairToken;
        return { sdkToken0: _sdkToken0, sdkToken1: _sdkToken1 };
    }, [sdkPairToken, xtmToken, direction]);

    const { token0, token1 } = useMemo(() => {
        if (!currentChainId) return { token0: undefined, token1: undefined };
        let uiInputToken: Token | NativeCurrency | undefined;
        let uiOutputToken: Token | NativeCurrency | undefined;
        let selectedPairSideToken: Token | NativeCurrency | undefined;

        if (pairTokenAddress === null) {
            selectedPairSideToken = Ether.onChain(currentChainId);
        } else {
            const currentWeth = WETH9[currentChainId];
            if (currentWeth && pairTokenAddress.toLowerCase() === currentWeth.address.toLowerCase()) {
                selectedPairSideToken = currentWeth;
            } else {
                selectedPairSideToken =
                    KNOWN_SDK_TOKENS[currentChainId]?.[pairTokenAddress.toLowerCase() as `0x${string}`];
            }
        }
        const xtmUiToken = xtmToken;
        if (direction === 'toXtm') {
            uiInputToken = selectedPairSideToken;
            uiOutputToken = xtmUiToken;
        } else {
            uiInputToken = xtmUiToken;
            uiOutputToken = selectedPairSideToken;
        }
        return { token0: uiInputToken, token1: uiOutputToken };
    }, [pairTokenAddress, xtmToken, direction, currentChainId]);

    // ---------- Clear errors ----------
    useEffect(() => {
        setError(null);
        setInsufficientLiquidity(false);
    }, [sdkToken0, sdkToken1, pairTokenAddress, direction, currentChainId]);

    // ---------- Route and Pair ----------
    const getPair = useCallback(
        async (preview?: boolean): Promise<Pair | null> => {
            if (!sdkToken0 || !sdkToken1 || !provider || sdkToken0.chainId !== sdkToken1.chainId) {
                if (!preview) setError('Invalid token setup or provider for pair.');
                return null;
            }
            setIsFetchingPair(true);
            setError(null);
            try {
                const orderedPairs = direction !== 'toXtm' ? [sdkToken0, sdkToken1] : [sdkToken1, sdkToken0];
                const computedPairAddress = Pair.getAddress(orderedPairs[0], orderedPairs[1]);
                const pairContract = new Contract(computedPairAddress, uniswapV2PairAbi, provider);
                const reservesData = await pairContract['getReserves']();
                const [reserve0BigInt, reserve1BigInt] = [
                    BigInt(reservesData[0].toString()),
                    BigInt(reservesData[1].toString()),
                ];

                if (reserve0BigInt === 0n && reserve1BigInt === 0n && !preview) {
                    setError('Pair has no liquidity.');
                    setIsFetchingPair(false);
                    return null;
                }
                const pair = new Pair(
                    CurrencyAmount.fromRawAmount(orderedPairs[0], reserve0BigInt.toString()),
                    CurrencyAmount.fromRawAmount(orderedPairs[1], reserve1BigInt.toString())
                );
                setIsFetchingPair(false);
                return pair;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                if (!preview) setError(`Failed to fetch pair: ${e.message}`);
                setIsFetchingPair(false);
                return null;
            }
        },
        [sdkToken0, sdkToken1, provider, direction]
    );

    // ---------- Trade Details ----------

    const getTradeDetails = useCallback(
        async (amountRaw: string, amountType: SwapField): Promise<TradeDetails> => {
            setInsufficientLiquidity(false);
            if (!publicClient || !currentChainId || !sdkToken0 || !sdkToken1 || !routerAddress) {
                setError('Prerequisites for trade details not met.');
                return { trade: null, route: null };
            }
            if (!/^\d+$/.test(amountRaw) || BigInt(amountRaw) <= 0n) {
                setError('Invalid or zero amount provided.');
                return { trade: null, route: null };
            }

            const pair = await getPair(true);
            if (!pair) {
                if (!error) setError('Could not find liquidity pair for trade.');
                return { trade: null, route: null };
            }

            let trade: Trade<Token, Token, TradeType> | null = null;
            let route: Route<Token, Token> | null = null;

            try {
                route = new Route([pair], sdkToken0, sdkToken1);
                if (amountType === 'ethTokenField') {
                    const currencyAmountIn = CurrencyAmount.fromRawAmount(sdkToken0, amountRaw);
                    trade = new Trade(route, currencyAmountIn, TradeType.EXACT_INPUT);
                } else {
                    const currencyAmountOut = CurrencyAmount.fromRawAmount(sdkToken1, amountRaw);
                    trade = new Trade(route, currencyAmountOut, TradeType.EXACT_OUTPUT);
                }
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
                return { trade: null, route, inputAmount: trade?.inputAmount, outputAmount: trade?.outputAmount };
            }

            if (!trade) return { trade: null, route, inputAmount: undefined, outputAmount: undefined };

            let estimatedGasFeeNativeStr: string | null = null;
            let estimatedGasFeeUSDStr: string | null = null;

            if (isConnected && accountAddress) {
                try {
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

                    const estimatedGasLimit = await publicClient.estimateGas({
                        account: accountAddress as `0x${string}`,
                        to: routerAddress,
                        data: callData,
                        value: valueToSend,
                    });
                    const gasPrice = await publicClient.getGasPrice();
                    if (estimatedGasLimit && gasPrice) {
                        const estimatedTotalGasCostNative = estimatedGasLimit * gasPrice;
                        estimatedGasFeeNativeStr = formatNativeGasFee(
                            estimatedTotalGasCostNative,
                            publicClient.chain.nativeCurrency.decimals,
                            publicClient.chain.nativeCurrency.symbol
                        );
                        if (nativeCurrencyPriceUSD) {
                            const feeInNativeNum = parseFloat(
                                formatUnits(estimatedTotalGasCostNative, publicClient.chain.nativeCurrency.decimals)
                            );
                            estimatedGasFeeUSDStr = formatGasFeeUSD(feeInNativeNum, nativeCurrencyPriceUSD);
                        }
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (gasError: any) {
                    console.warn(
                        'Could not estimate gas for the swap preview:',
                        gasError.shortMessage || gasError.message
                    );
                }
            }

            return {
                trade,
                route,
                estimatedGasFeeNative: estimatedGasFeeNativeStr || '',
                estimatedGasFeeUSD: estimatedGasFeeUSDStr || '',
                midPrice: route.midPrice,
                inputAmount: trade.inputAmount,
                outputAmount: trade.outputAmount,
            };
        },
        [
            publicClient,
            currentChainId,
            sdkToken0,
            sdkToken1,
            routerAddress,
            getPair,
            isConnected,
            accountAddress,
            error,
            token0?.isNative,
            token1?.isNative,
            nativeCurrencyPriceUSD,
            setError,
        ]
    );

    // ---------- Approval ----------
    const checkAndRequestApproval = useCallback(
        async (tokenToApprove: Token, amountToApproveRaw: string): Promise<boolean> => {
            // Added tokenToApprove
            if (!accountAddress || !routerAddress || !currentChainId || tokenToApprove.isNative || !signer) {
                setError('Approval prerequisites not met or native token.');
                return tokenToApprove.isNative; // True if native, false otherwise
            }
            setIsApproving(true);
            setError(null);
            try {
                const tokenContract = new Contract(tokenToApprove.address, erc20Abi, signer);
                const amountToApproveBI = BigInt(amountToApproveRaw);
                const currentAllowance = BigInt(
                    (await tokenContract.allowance(accountAddress, routerAddress)).toString()
                );

                if (currentAllowance < amountToApproveBI) {
                    const approveTx = await tokenContract.approve(routerAddress, amountToApproveBI);
                    const receipt = await approveTx.wait(1);
                    if (receipt?.status !== 1) throw new Error('Approval transaction failed.');
                }
                setIsApproving(false);
                return true;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                console.error('Error during approval:', e);
                setError(`Approval failed: ${e?.reason || e?.message || 'User rejected'}`);
                setIsApproving(false);
                return false;
            }
        },
        [signer, accountAddress, routerAddress, currentChainId, setError, setIsApproving]
    );

    // ---------- Swap Execution ----------
    const executeSwap = useCallback(
        async (tradeToExecute: Trade<Token, Token, TradeType>): Promise<TransactionResponse | null> => {
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
                const amountIn = BigInt(tradeToExecute.inputAmount.quotient.toString());
                const amountOutMin = BigInt(tradeToExecute.minimumAmountOut(SLIPPAGE_TOLERANCE).quotient.toString());
                const path = tradeToExecute.route.path.map((t) => t.address as `0x${string}`);
                const to = accountAddress as `0x${string}`;
                const deadline = Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60;
                const inputIsNativeForRouter = token0?.isNative;
                const outputIsNativeForRouter = token1?.isNative;

                if (sdkToken0 && !sdkToken0.isNative && direction === 'toXtm') {
                    const approved = await checkAndRequestApproval(sdkToken0, amountIn.toString());
                    if (!approved) {
                        setIsLoading(false);
                        return null;
                    }
                }

                const routerContract = new Contract(routerAddress, uniswapV2RouterAbi, signer);
                const txOptions: { value?: bigint; gasLimit?: bigint } = {};
                let methodName: string;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let methodArgs: any[];

                if (inputIsNativeForRouter) {
                    methodName = 'swapExactETHForTokens';
                    methodArgs = [amountOutMin, path, to, deadline];
                    txOptions.value = amountIn;
                } else if (outputIsNativeForRouter) {
                    methodName = 'swapExactTokensForETH';
                    methodArgs = [amountIn, amountOutMin, path, to, deadline];
                } else {
                    methodName = 'swapExactTokensForTokens';
                    methodArgs = [amountIn, amountOutMin, path, to, deadline];
                }

                try {
                    const estimatedGas = await routerContract[methodName].estimateGas(...methodArgs, txOptions);
                    txOptions.gasLimit = (estimatedGas * 120n) / 100n;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (gasError: any) {
                    console.warn('Gas estimation failed for executeSwap:', gasError.message);
                }

                const swapTxResponse = await routerContract[methodName](...methodArgs, txOptions);
                setIsLoading(false);
                return swapTxResponse;
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
            token0?.isNative,
            token1?.isNative,
            direction,
            checkAndRequestApproval,
        ]
    );

    // ---------- Admin ----------
    const addLiquidity = useCallback(
        async ({ xtmAmount, ethAmount }: { xtmAmount: number; ethAmount?: number }) => {
            if (!accountAddress || !signer || !currentChainId || !xtmToken || !routerAddress) {
                addToast({ title: 'Error', text: 'Prerequisites not met.', type: 'error' });
                return;
            }
            if (xtmAmount <= 0) {
                addToast({ title: 'Input Error', text: 'XTM amount must be greater than zero.', type: 'error' });
                return;
            }

            try {
                setIsLoading(true);
                const xtmAmountBigInt = parseUnits(xtmAmount.toString(), xtmToken.decimals);
                let ethAmountToProvideBigInt: bigint;

                if (ethAmount === undefined || ethAmount <= 0) {
                    const pair = await getPair();
                    if (!pair) {
                        addToast({ title: 'Pair Error', text: 'Could not find liquidity pair.', type: 'error' });
                        setIsLoading(false);
                        return;
                    }
                    const wethToken = WETH9[currentChainId];
                    if (!wethToken) {
                        addToast({
                            title: 'Config Error',
                            text: `WETH not configured for chain ${currentChainId}.`,
                            type: 'error',
                        });
                        setIsLoading(false);
                        return;
                    }

                    let xtmReserveCurrencyAmount: CurrencyAmount<Token>;
                    let wethReserveCurrencyAmount: CurrencyAmount<Token>;

                    if (pair.token0.equals(xtmToken)) {
                        xtmReserveCurrencyAmount = pair.reserve0;
                        wethReserveCurrencyAmount = pair.reserve1;
                    } else if (pair.token1.equals(xtmToken)) {
                        xtmReserveCurrencyAmount = pair.reserve1;
                        wethReserveCurrencyAmount = pair.reserve0;
                    } else {
                        addToast({
                            title: 'Logic Error',
                            text: 'Could not match XTM token with pair tokens.',
                            type: 'error',
                        });
                        setIsLoading(false);
                        return;
                    }
                    const xtmReservesBigInt = BigInt(xtmReserveCurrencyAmount.quotient.toString());
                    const wethReservesBigInt = BigInt(wethReserveCurrencyAmount.quotient.toString());

                    if (xtmReservesBigInt === 0n || wethReservesBigInt === 0n) {
                        addToast({
                            title: 'Info',
                            text: 'Pool is new. Please provide both XTM and ETH amounts.',
                            type: 'info',
                        });
                        setIsLoading(false);
                        return;
                    }
                    ethAmountToProvideBigInt = (xtmAmountBigInt * wethReservesBigInt) / xtmReservesBigInt;
                    addToast({
                        title: 'Info',
                        text: `Calculated ETH: ${formatUnits(ethAmountToProvideBigInt, 18)} ETH`,
                        type: 'info',
                    });
                } else {
                    ethAmountToProvideBigInt = parseUnits(ethAmount.toString(), 18);
                }

                const deadline = Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60;
                const approved = await checkAndRequestApproval(xtmToken, xtmAmountBigInt.toString());
                if (!approved) {
                    setIsLoading(false);
                    return;
                }

                const slippageQuotientBigInt = BigInt(SLIPPAGE_TOLERANCE.quotient.toString());
                const routerContract = new Contract(routerAddress, uniswapV2RouterAbi, signer);
                const txOptions = { value: ethAmountToProvideBigInt };
                const addLiqTx = await routerContract.addLiquidityETH(
                    xtmToken.address,
                    xtmAmountBigInt,
                    (xtmAmountBigInt * (10000n - slippageQuotientBigInt)) / 10000n, // amountAMin
                    (ethAmountToProvideBigInt * (10000n - slippageQuotientBigInt)) / 10000n, // amountBMin
                    accountAddress,
                    deadline,
                    txOptions
                );
                addToast({
                    title: 'Processing',
                    text: `Adding liquidity... Tx: ${addLiqTx.hash.substring(0, 10)}...`,
                    type: 'info',
                });
                const receipt = await addLiqTx.wait(1);

                if (receipt?.status === 1) {
                    addToast({ title: 'Success', text: 'Liquidity Added Successfully!', type: 'success' });
                } else {
                    throw new Error('Add liquidity transaction failed.');
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                console.error('Error adding liquidity:', e);
                const message = e?.reason || e?.message || 'Failed to add liquidity.';
                addToast({ title: 'Error', text: message, type: 'error' });
            } finally {
                setIsLoading(false);
            }
        },
        [accountAddress, signer, currentChainId, xtmToken, routerAddress, getPair, checkAndRequestApproval, addToast]
    );

    const removeAllLiquidity = useCallback(async () => {
        addToast({ title: 'Starting Removal', text: 'Initiating liquidity removal...', type: 'info' });
        setIsLoading(true);

        if (!accountAddress || !signer || !currentChainId || !xtmToken || !routerAddress) {
            const errText = `Prerequisites not met. Account: ${!!accountAddress}, Signer: ${!!signer}, ChainID: ${currentChainId}, XTM Token: ${!!xtmToken}, Router: ${!!routerAddress}`;
            addToast({ title: 'Error', text: errText, type: 'error' });
            setIsLoading(false);
            return;
        }

        const wethToken = WETH9[currentChainId];
        if (!wethToken) {
            addToast({
                title: 'Config Error',
                text: `WETH not configured for chain ${currentChainId}.`,
                type: 'error',
            });
            setIsLoading(false);
            return;
        }

        let lpTokenAddress: `0x${string}`;
        try {
            const [tokenA, tokenB] = xtmToken.sortsBefore(wethToken) ? [xtmToken, wethToken] : [wethToken, xtmToken];
            lpTokenAddress = Pair.getAddress(tokenA, tokenB) as `0x${string}`;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            addToast({ title: 'SDK Error', text: `Could not calculate pair address: ${e.message}`, type: 'error' });
            setIsLoading(false);
            return;
        }

        try {
            const lpTokenContractEthers = new Contract(lpTokenAddress, erc20Abi, signer.provider || signer);
            const userLpBalanceRaw = await lpTokenContractEthers.balanceOf(accountAddress);
            const userLpBalanceBigInt = BigInt(userLpBalanceRaw.toString());

            if (userLpBalanceBigInt === 0n) {
                addToast({ title: 'Info', text: 'You have no liquidity in this pool to remove.', type: 'info' });
                setIsLoading(false);
                return;
            }
            addToast({ title: 'Info', text: `Found ${formatUnits(userLpBalanceBigInt, 18)} LP tokens.`, type: 'info' });

            const lpTokenForApproval = new Token(currentChainId, lpTokenAddress, 18); // Assuming 18 decimals for LP token
            const approved = await checkAndRequestApproval(lpTokenForApproval, userLpBalanceBigInt.toString());
            if (!approved) {
                setIsLoading(false);
                return;
            }

            const amountTokenMin = 1n;
            const amountETHMin = 1n;
            const deadline = Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60;

            addToast({ title: 'Action Required', text: 'Please confirm removing all liquidity.', type: 'info' });
            const routerContract = new Contract(routerAddress, uniswapV2RouterAbi, signer);
            const removeTx = await routerContract.removeLiquidityETH(
                xtmToken.address,
                userLpBalanceBigInt,
                amountTokenMin,
                amountETHMin,
                accountAddress,
                deadline
            );
            addToast({
                title: 'Processing',
                text: `Removing liquidity... Tx: ${removeTx.hash.substring(0, 10)}...`,
                type: 'info',
            });
            const receipt = await removeTx.wait(1);

            if (receipt?.status === 1) {
                addToast({ title: 'Success', text: 'All liquidity removed successfully!', type: 'success' });
            } else {
                throw new Error('Remove liquidity transaction failed.');
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            console.error('[RemoveLiq] Error during liquidity removal process:', e);
            const reason = e?.reason || e?.data?.message || e?.shortMessage || e?.message || 'Unknown error.';
            addToast({ title: 'Error', text: `Removal failed: ${reason}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [accountAddress, signer, currentChainId, xtmToken, routerAddress, addToast, checkAndRequestApproval]);

    return {
        pairTokenAddress,
        direction,
        isLoading: isLoading || isApproving || isFetchingPair,
        isApproving,
        isFetchingPair,
        error,
        setPairTokenAddress,
        setDirection,
        token0,
        token1,
        sdkToken0,
        sdkToken1,
        routerAddress,
        getPair,
        getTradeDetails,
        checkAndRequestApproval,
        executeSwap,
        addLiquidity,
        insufficientLiquidity,
        removeAllLiquidity,
        isReady:
            !!signer &&
            !!accountAddress &&
            isConnected &&
            !!sdkToken0 &&
            !!sdkToken1 &&
            !!routerAddress &&
            !!publicClient &&
            !!currentChainId,
    };
};
