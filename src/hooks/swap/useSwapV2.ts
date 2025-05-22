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
    RPC_URLS,
} from './lib/constants';
import { walletClientToSigner, formatNativeGasFee, formatGasFeeUSD } from './lib/utils';
import { TradeDetails, SwapField, SwapDirection } from './lib/types';
import { useToastStore } from '@app/components/ToastStack/useToastStore';
import { useConfigCoreStore } from '@app/store';

export const useUniswapV2Interactions = () => {
    const [pairTokenAddress, setPairTokenAddress] = useState<`0x${string}` | null>(null); // For swapping UI
    const [direction, setDirection] = useState<SwapDirection>('toXtm'); // For swapping UI
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
    // This is specifically XTM, used as one side of the default swap pair
    const xtmTokenForSwap = useMemo(
        () => (currentChainId ? XTM_SDK_TOKEN[currentChainId] : undefined),
        [currentChainId]
    );
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
        if (!currentChainId || !RPC_URLS[currentChainId]) return null;
        if (accountAddress) return null; // Prefer signer's provider if connected
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

    // ---------- Pair Token (primarily for SWAP UI) ----------
    const sdkPairTokenForSwap = useMemo(() => {
        // Renamed for clarity in swap context
        if (!currentChainId) return undefined;
        const currentWeth = WETH9[currentChainId];
        if (pairTokenAddress === null) return currentWeth; // Default to WETH if no address
        const lowerCaseAddress = pairTokenAddress.toLowerCase() as `0x${string}`;
        return KNOWN_SDK_TOKENS[currentChainId]?.[lowerCaseAddress] || undefined;
    }, [pairTokenAddress, currentChainId]);

    // sdkToken0 and sdkToken1 for SWAPPING logic
    const { sdkToken0, sdkToken1 } = useMemo(() => {
        const _sdkToken0 = direction === 'toXtm' ? sdkPairTokenForSwap : xtmTokenForSwap;
        const _sdkToken1 = direction === 'toXtm' ? xtmTokenForSwap : sdkPairTokenForSwap;
        return { sdkToken0: _sdkToken0, sdkToken1: _sdkToken1 };
    }, [sdkPairTokenForSwap, xtmTokenForSwap, direction]);

    // token0 and token1 for SWAPPING UI display (handles NativeCurrency)
    const { token0, token1 } = useMemo(() => {
        if (!currentChainId) return { token0: undefined, token1: undefined };
        let uiInputToken: Token | NativeCurrency | undefined;
        let uiOutputToken: Token | NativeCurrency | undefined;
        let selectedPairSideTokenForSwapUi: Token | NativeCurrency | undefined;

        if (pairTokenAddress === null) {
            // User selected ETH for swap
            selectedPairSideTokenForSwapUi = Ether.onChain(currentChainId);
        } else {
            // User selected an ERC20 for swap
            const currentWeth = WETH9[currentChainId];
            // If selected address is WETH, still treat as WETH (Token) for SDK, but UI might show ETH
            if (currentWeth && pairTokenAddress.toLowerCase() === currentWeth.address.toLowerCase()) {
                selectedPairSideTokenForSwapUi = currentWeth; // SDK needs WETH for ERC20 operations
            } else {
                selectedPairSideTokenForSwapUi =
                    KNOWN_SDK_TOKENS[currentChainId]?.[pairTokenAddress.toLowerCase() as `0x${string}`];
            }
        }
        const xtmUiToken = xtmTokenForSwap; // XTM is always an ERC20

        if (direction === 'toXtm') {
            uiInputToken = selectedPairSideTokenForSwapUi;
            uiOutputToken = xtmUiToken;
        } else {
            uiInputToken = xtmUiToken;
            uiOutputToken = selectedPairSideTokenForSwapUi;
        }
        return { token0: uiInputToken, token1: uiOutputToken };
    }, [pairTokenAddress, xtmTokenForSwap, direction, currentChainId]);

    // ---------- Clear errors ----------
    useEffect(() => {
        setError(null);
        setInsufficientLiquidity(false);
    }, [sdkToken0, sdkToken1, pairTokenAddress, direction, currentChainId]);

    // ---------- Route and Pair (Generic for Swap and Liquidity) ----------
    const getPair = useCallback(
        async (tokenA: Token, tokenB: Token, preview?: boolean): Promise<Pair | null> => {
            // Now takes two tokens
            if (!tokenA || !tokenB || !provider || tokenA.chainId !== tokenB.chainId) {
                if (!preview) setError('Invalid token setup or provider for pair.');
                return null;
            }
            setIsFetchingPair(true);
            setError(null);
            try {
                // Uniswap SDK's Pair.getAddress sorts tokens internally.
                const computedPairAddress = Pair.getAddress(tokenA, tokenB);
                const pairContract = new Contract(computedPairAddress, uniswapV2PairAbi, provider);
                const reservesData = await pairContract['getReserves']();

                // Reserves are returned in order of token0, token1 where token0.address < token1.address
                const [reserve0BN, reserve1BN] = [reservesData[0], reservesData[1]];

                // Create amounts based on the sorted order
                const [sortedTokenA, sortedTokenB] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];

                const pairInstance = new Pair(
                    CurrencyAmount.fromRawAmount(sortedTokenA, reserve0BN.toString()),
                    CurrencyAmount.fromRawAmount(sortedTokenB, reserve1BN.toString())
                );

                const reserveQuotient0 = BigInt(pairInstance.reserve0.quotient.toString());

                if (reserveQuotient0 === 0n && reserveQuotient0 === 0n && !preview) {
                    setError('Pair has no liquidity.');
                }
                setIsFetchingPair(false);
                return pairInstance;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                if (!preview) setError(`Failed to fetch pair for ${tokenA.symbol}-${tokenB.symbol}: ${e.message}`);
                setIsFetchingPair(false);
                return null;
            }
        },
        [provider, setError, setIsFetchingPair] // Removed direction and specific sdkTokens from deps
    );

    // ---------- Trade Details (for SWAPPING) ----------
    const getTradeDetails = useCallback(
        async (amountRaw: string, amountType: SwapField): Promise<TradeDetails> => {
            setInsufficientLiquidity(false);
            // Uses sdkToken0 and sdkToken1 which are specific to the swap UI
            if (!publicClient || !currentChainId || !sdkToken0 || !sdkToken1 || !routerAddress) {
                setError('Prerequisites for trade details not met.');
                return { trade: null, route: null };
            }
            if (!/^\d+$/.test(amountRaw) || BigInt(amountRaw) <= 0n) {
                setError('Invalid or zero amount provided.');
                return { trade: null, route: null };
            }

            const pair = await getPair(sdkToken0, sdkToken1, true); // Pass swap tokens
            if (!pair) {
                if (!error) setError('Could not find liquidity pair for trade.');
                return { trade: null, route: null };
            }

            let trade: Trade<Token, Token, TradeType> | null = null;
            let route: Route<Token, Token> | null = null;

            try {
                route = new Route([pair], sdkToken0, sdkToken1);
                if (amountType === 'ethTokenField') {
                    // Input field for token0
                    const currencyAmountIn = CurrencyAmount.fromRawAmount(sdkToken0, amountRaw);
                    trade = new Trade(route, currencyAmountIn, TradeType.EXACT_INPUT);
                } else {
                    // Input field for token1
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

            // ... (rest of gas estimation logic - seems okay, ensure token0/token1 for UI mapping are correct)
            // Make sure `token0.isNative` and `token1.isNative` correctly reflect the UI tokens.
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

                    // Use `token0` and `token1` from the UI mapping for native checks
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
            sdkToken0, // Swap specific
            sdkToken1, // Swap specific
            token0, // UI specific for native check
            token1, // UI specific for native check
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
        async (tokenToApprove: Token, amountToApproveRaw: string, spenderAddress?: `0x${string}`): Promise<boolean> => {
            const spender = spenderAddress || routerAddress; // Default to router if not provided
            if (!accountAddress || !spender || !currentChainId || tokenToApprove.isNative || !signer) {
                setError('Approval prerequisites not met or native token.');
                return tokenToApprove.isNative;
            }
            setIsApproving(true);
            setError(null);
            addToast({ title: 'Approval', text: `Requesting approval for ${tokenToApprove.symbol}...`, type: 'info' });
            try {
                const tokenContract = new Contract(tokenToApprove.address, erc20Abi, signer);
                const amountToApproveBI = BigInt(amountToApproveRaw);
                const currentAllowance = BigInt((await tokenContract.allowance(accountAddress, spender)).toString());

                if (currentAllowance < amountToApproveBI) {
                    const approveTx = await tokenContract.approve(spender, amountToApproveBI);
                    addToast({
                        title: 'Processing',
                        text: `Approval for ${tokenToApprove.symbol} pending...`,
                        type: 'info',
                    });
                    const receipt = await approveTx.wait(1);
                    if (receipt?.status !== 1) throw new Error('Approval transaction failed on-chain.');
                    addToast({ title: 'Success', text: `${tokenToApprove.symbol} approved!`, type: 'success' });
                } else {
                    addToast({
                        title: 'Info',
                        text: `${tokenToApprove.symbol} already approved for sufficient amount.`,
                        type: 'info',
                    });
                }
                setIsApproving(false);
                return true;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                console.error('Error during approval:', e);
                const message = e?.reason || e?.message || 'User rejected or approval failed.';
                setError(`Approval failed: ${message}`);
                addToast({
                    title: 'Error',
                    text: `Approval for ${tokenToApprove.symbol} failed: ${message}`,
                    type: 'error',
                });
                setIsApproving(false);
                return false;
            }
        },
        [signer, accountAddress, routerAddress, currentChainId, setError, setIsApproving, addToast]
    );

    // ---------- Swap Execution (for SWAPPING) ----------
    const executeSwap = useCallback(
        async (tradeToExecute: Trade<Token, Token, TradeType>): Promise<TransactionResponse | null> => {
            setError(null);
            setIsLoading(true);
            // sdkToken0 and sdkToken1 are for the current swap pair
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
                // Approval for the input token if it's ERC20
                // sdkToken0 is the input token for the swap
                if (!sdkToken0.isNative) {
                    // Check if input token for swap is not native
                    const approved = await checkAndRequestApproval(
                        sdkToken0,
                        tradeToExecute.inputAmount.quotient.toString()
                    );
                    if (!approved) {
                        setIsLoading(false);
                        return null;
                    }
                }

                const amountIn = BigInt(tradeToExecute.inputAmount.quotient.toString());
                const amountOutMinOrExact =
                    tradeToExecute.tradeType === TradeType.EXACT_INPUT
                        ? BigInt(tradeToExecute.minimumAmountOut(SLIPPAGE_TOLERANCE).quotient.toString())
                        : BigInt(tradeToExecute.outputAmount.quotient.toString()); // For EXACT_OUTPUT, this is exact out

                const amountInMaxOrExact =
                    tradeToExecute.tradeType === TradeType.EXACT_OUTPUT
                        ? BigInt(tradeToExecute.maximumAmountIn(SLIPPAGE_TOLERANCE).quotient.toString())
                        : amountIn; // For EXACT_INPUT, this is exact in

                const path = tradeToExecute.route.path.map((t) => t.address as `0x${string}`);
                const to = accountAddress as `0x${string}`;
                const deadline = Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60;

                // Use token0 and token1 from UI mapping for native checks to determine router method
                const inputIsNativeForRouter = token0?.isNative;
                const outputIsNativeForRouter = token1?.isNative;

                const routerContract = new Contract(routerAddress, uniswapV2RouterAbi, signer);
                const txOptions: { value?: bigint; gasLimit?: bigint } = {};
                let methodName: string;
                let methodArgs: any[];

                if (tradeToExecute.tradeType === TradeType.EXACT_INPUT) {
                    if (inputIsNativeForRouter) {
                        methodName = 'swapExactETHForTokens';
                        methodArgs = [amountOutMinOrExact, path, to, deadline];
                        txOptions.value = amountInMaxOrExact; // amountIn
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
                        methodName = 'swapETHForExactTokens'; // Not commonly used, but supported
                        methodArgs = [amountOutMinOrExact, path, to, deadline]; // amountOutMinOrExact is exactOut here
                        txOptions.value = amountInMaxOrExact; // amountInMax is maxIn here
                    } else if (outputIsNativeForRouter) {
                        methodName = 'swapTokensForExactETH';
                        methodArgs = [amountOutMinOrExact, amountInMaxOrExact, path, to, deadline];
                    } else {
                        methodName = 'swapTokensForExactTokens';
                        methodArgs = [amountOutMinOrExact, amountInMaxOrExact, path, to, deadline];
                    }
                }

                try {
                    const estimatedGas = await routerContract[methodName].estimateGas(...methodArgs, txOptions);
                    txOptions.gasLimit = (estimatedGas * 120n) / 100n;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (gasError: any) {
                    console.warn('Gas estimation failed for executeSwap:', gasError.message);
                    addToast({
                        title: 'Warning',
                        text: 'Gas estimation failed, proceeding with default.',
                        type: 'warning',
                    });
                }

                addToast({ title: 'Processing', text: `Executing swap...`, type: 'info' });
                const swapTxResponse = await routerContract[methodName](...methodArgs, txOptions);
                setIsLoading(false);
                return swapTxResponse;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                console.error('Error executing swap transaction:', error);
                const reason = error?.reason || error?.data?.message || error?.message || 'Unknown swap error.';
                setError(`Swap failed: ${reason}`);
                addToast({ title: 'Error', text: `Swap failed: ${reason}`, type: 'error' });
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
            sdkToken0, // Swap specific
            sdkToken1, // Swap specific
            token0, // UI specific for native check
            token1, // UI specific for native check
            checkAndRequestApproval,
            addToast,
            setError,
            setIsLoading,
        ]
    );

    // ---------- Liquidity Management (Generalized) ----------
    const addLiquidity = useCallback(
        async ({
            tokenA, // The first token (can be XTM, MUSDC, etc.)
            tokenB, // The second token (can be ETH/WETH, MUSDC, etc.)
            amountADesired, // Human-readable amount for token A
            amountBDesired, // Human-readable amount for token B (optional)
        }: {
            tokenA: Token;
            tokenB: Token | NativeCurrency; // Allow NativeCurrency for tokenB if it's ETH
            amountADesired: number;
            amountBDesired?: number;
        }) => {
            if (!accountAddress || !signer || !currentChainId || !routerAddress) {
                addToast({ title: 'Error', text: 'Prerequisites for adding liquidity not met.', type: 'error' });
                return;
            }
            if (amountADesired <= 0) {
                addToast({ title: 'Input Error', text: `Amount for ${tokenA.symbol} must be > 0.`, type: 'error' });
                return;
            }
            if (amountBDesired !== undefined && amountBDesired <= 0 && !tokenB.isNative) {
                // only check if not native and provided
                addToast({
                    title: 'Input Error',
                    text: `Amount for ${tokenB.symbol} must be > 0 or not provided.`,
                    type: 'error',
                });
                return;
            }

            setIsLoading(true);
            addToast({ title: 'Processing', text: 'Preparing to add liquidity...', type: 'info' });

            try {
                const amountADesiredBigInt = parseUnits(amountADesired.toString(), tokenA.decimals);
                let amountBDesiredBigInt: bigint;

                // Determine if tokenB is to be treated as ETH for router interaction
                const wethForChain = WETH9[currentChainId];
                const tokenBIsNativeForRouter = tokenB.isNative || (wethForChain && tokenB.equals(wethForChain));
                const actualTokenBForSdk = tokenB.isNative ? wethForChain : (tokenB as Token); // Use WETH for SDK if tokenB is native

                if (!actualTokenBForSdk) {
                    addToast({
                        title: 'Config Error',
                        text: `WETH not configured for chain ${currentChainId} when native currency is used.`,
                        type: 'error',
                    });
                    setIsLoading(false);
                    return;
                }

                if (amountBDesired === undefined || amountBDesired <= 0) {
                    const pair = await getPair(tokenA, actualTokenBForSdk); // Use actualTokenBForSdk
                    if (!pair) {
                        addToast({
                            title: 'Pair Error',
                            text: 'Could not find liquidity pair. If new, provide both amounts.',
                            type: 'info',
                        });
                        setIsLoading(false);
                        return;
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
                        return;
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

                // Approve tokenA
                const approvedA = await checkAndRequestApproval(tokenA, amountADesiredBigInt.toString());
                if (!approvedA) {
                    setIsLoading(false);
                    // Error toast is handled by checkAndRequestApproval
                    return;
                }

                // Approve tokenB if it's an ERC20 (not native for router)
                if (!tokenBIsNativeForRouter) {
                    const approvedB = await checkAndRequestApproval(
                        actualTokenBForSdk,
                        amountBDesiredBigInt.toString()
                    );
                    if (!approvedB) {
                        setIsLoading(false);
                        return;
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

                if (tokenBIsNativeForRouter) {
                    // One of the tokens is ETH/WETH, use addLiquidityETH
                    // The ERC20 token must be `tokenA` for `addLiquidityETH` if `tokenB` is ETH.
                    // Or `tokenB` is the ERC20 if `tokenA` was ETH (which is not the case here as tokenA is always Token)
                    addLiqTx = await routerContract.addLiquidityETH(
                        tokenA.address, // The ERC20 token
                        amountADesiredBigInt,
                        amountAMin,
                        amountBMin, // This is min ETH
                        accountAddress,
                        deadline,
                        { value: amountBDesiredBigInt } // ETH value
                    );
                } else {
                    // Both are ERC20s
                    addLiqTx = await routerContract.addLiquidity(
                        tokenA.address,
                        actualTokenBForSdk.address, // actualTokenBForSdk is Token here
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
                const receipt = await addLiqTx.wait(1);

                if (receipt?.status === 1) {
                    addToast({ title: 'Success', text: 'Liquidity Added Successfully!', type: 'success' });
                } else {
                    throw new Error('Add liquidity transaction failed on-chain.');
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                console.error('Error adding liquidity:', e);
                const message = e?.data?.message || e?.reason || e?.message || 'Failed to add liquidity.';
                addToast({ title: 'Error', text: message, type: 'error' });
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
            tokenA: Token, // The first token of the pair
            tokenB: Token | NativeCurrency // The second token (can be ETH/WETH)
        ) => {
            addToast({ title: 'Starting Removal', text: 'Initiating liquidity removal...', type: 'info' });
            setIsLoading(true);

            if (!accountAddress || !signer || !currentChainId || !routerAddress) {
                addToast({ title: 'Error', text: 'Prerequisites not met for removing liquidity.', type: 'error' });
                setIsLoading(false);
                return;
            }

            // Determine if tokenB is to be treated as ETH for router interaction
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
                return;
            }

            let lpTokenAddress: `0x${string}`;
            try {
                lpTokenAddress = Pair.getAddress(tokenA, actualTokenBForSdk) as `0x${string}`;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                addToast({ title: 'SDK Error', text: `Could not calculate pair address: ${e.message}`, type: 'error' });
                setIsLoading(false);
                return;
            }

            try {
                const lpTokenContract = new Contract(lpTokenAddress, erc20Abi, signer.provider || signer);
                const userLpBalanceRaw = await lpTokenContract.balanceOf(accountAddress);
                const userLpBalanceBigInt = BigInt(userLpBalanceRaw.toString());

                if (userLpBalanceBigInt === 0n) {
                    addToast({ title: 'Info', text: 'You have no liquidity in this pool to remove.', type: 'info' });
                    setIsLoading(false);
                    return;
                }
                addToast({
                    title: 'Info',
                    text: `Found ${formatUnits(userLpBalanceBigInt, 18)} LP tokens. Attempting to remove all.`,
                    type: 'info',
                });

                const lpTokenForApproval = new Token(currentChainId, lpTokenAddress, 18, 'LP', 'V2 LP Token');
                const approved = await checkAndRequestApproval(lpTokenForApproval, userLpBalanceBigInt.toString());
                if (!approved) {
                    setIsLoading(false);
                    return;
                }

                const amountTokenAMin = 1n; // Min amount of tokenA to receive
                const amountTokenBMin = 1n; // Min amount of tokenB (or ETH) to receive
                const deadline = Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60;

                addToast({ title: 'Action Required', text: 'Please confirm removing all liquidity.', type: 'info' });
                const routerContract = new Contract(routerAddress, uniswapV2RouterAbi, signer);
                let removeTx: TransactionResponse;

                if (tokenBIsNativeForRouter) {
                    // One of the tokens is ETH/WETH
                    // The ERC20 token is tokenA in this setup
                    removeTx = await routerContract.removeLiquidityETH(
                        tokenA.address, // The ERC20 token
                        userLpBalanceBigInt,
                        amountTokenAMin, // Min ERC20
                        amountTokenBMin, // Min ETH
                        accountAddress,
                        deadline
                    );
                } else {
                    // Both are ERC20s
                    removeTx = await routerContract.removeLiquidity(
                        tokenA.address,
                        actualTokenBForSdk.address, // actualTokenBForSdk is Token here
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
                const receipt = await removeTx.wait(1);

                if (receipt?.status === 1) {
                    addToast({ title: 'Success', text: 'All liquidity removed successfully!', type: 'success' });
                } else {
                    throw new Error('Remove liquidity transaction failed on-chain.');
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                console.error('[RemoveLiq] Error:', e);
                const reason = e?.data?.message || e?.reason || e?.shortMessage || e?.message || 'Unknown error.';
                addToast({ title: 'Error', text: `Removal failed: ${reason}`, type: 'error' });
            } finally {
                setIsLoading(false);
            }
        },
        [accountAddress, signer, currentChainId, routerAddress, addToast, checkAndRequestApproval, setIsLoading]
    );

    return {
        // Swap UI related
        pairTokenAddress,
        direction,
        setPairTokenAddress,
        setDirection,
        token0, // UI display token (can be NativeCurrency)
        token1, // UI display token (can be NativeCurrency)
        sdkToken0, // SDK Token for swap logic
        sdkToken1, // SDK Token for swap logic

        // General state
        isLoading: isLoading || isApproving || isFetchingPair,
        isApproving,
        isFetchingPair,
        error,
        insufficientLiquidity, // Specific to swaps

        // Shared utilities
        routerAddress,
        getPair, // Modified to take tokenA, tokenB
        checkAndRequestApproval, // Generic

        // Swap specific functions
        getTradeDetails,
        executeSwap,

        // Liquidity specific functions (generalized)
        addLiquidity,
        removeAllLiquidity,

        // General readiness check
        isReady: !!signer && !!accountAddress && isConnected && !!routerAddress && !!publicClient && !!currentChainId,
    };
};
