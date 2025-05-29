import { Token, WETH9, Ether, NativeCurrency } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { Contract, Signer as EthersSigner, TransactionResponse, TransactionReceipt } from 'ethers';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { PublicClient as ViemPublicClient } from 'viem';

import {
    erc20Abi,
    uniswapV3SwapRouter02Abi,
    ROUTER_ADDRESSES_V3,
    QUOTER_ADDRESSES_V3,
    FACTORY_ADDRESSES_V3,
    XTM_SDK_TOKEN,
    KNOWN_SDK_TOKENS,
    DEADLINE_MINUTES,
    DEFAULT_V3_POOL_FEE,
} from './lib/constants';
import { encodePath, walletClientToSigner } from './lib/utils';
import { V3TradeDetails, SwapField, SwapDirection } from './lib/types';
import { useConfigCoreStore } from '@app/store';
import { useUniswapV3Pathfinder } from './useUniswapV3Pathfinder';

export const useUniswapV3Interactions = () => {
    const [pairTokenAddress, setPairTokenAddress] = useState<`0x${string}` | null>(null);
    const [direction, setDirection] = useState<SwapDirection>('toXtm');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [insufficientLiquidity, setInsufficientLiquidity] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isFetchingPool, setIsFetchingPool] = useState(false);
    const abortApproveControllerRef = useRef<AbortController | null>(null);

    const { address: accountAddress, isConnected, chain } = useAccount();
    const { data: walletClient } = useWalletClient();

    const defaultChainId = useConfigCoreStore((s) => s.default_chain);
    const currentChainId = useMemo(() => chain?.id || defaultChainId, [chain?.id, defaultChainId]);
    const publicClient = usePublicClient({ chainId: currentChainId }) as ViemPublicClient;

    const v3RouterAddress = useMemo(
        () => (currentChainId ? ROUTER_ADDRESSES_V3[currentChainId] : undefined),
        [currentChainId]
    );
    const v3QuoterAddress = useMemo(
        () => (currentChainId ? QUOTER_ADDRESSES_V3[currentChainId] : undefined),
        [currentChainId]
    );
    const v3FactoryAddress = useMemo(
        () => (currentChainId ? FACTORY_ADDRESSES_V3[currentChainId] : undefined),
        [currentChainId]
    );

    const xtmTokenForSwap = useMemo(
        () => (currentChainId ? XTM_SDK_TOKEN[currentChainId] : undefined),
        [currentChainId]
    );

    const [signer, setSigner] = useState<EthersSigner | null>(null);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (walletClient) {
                const s = await walletClientToSigner(walletClient);
                if (!cancelled) {
                    setSigner(s);
                }
            } else if (!cancelled) {
                setSigner(null);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [walletClient]);

    // Modified to prioritize native ETH over WETH
    const sdkPairTokenForSwap = useMemo(() => {
        if (!currentChainId) return undefined;

        // If pairTokenAddress is null, return native ETH instead of WETH
        if (pairTokenAddress === null) {
            return Ether.onChain(currentChainId);
        }

        const lowerCaseAddress = pairTokenAddress.toLowerCase() as `0x${string}`;
        const currentWeth = WETH9[currentChainId as keyof typeof WETH9];

        // If the selected token is WETH, return native ETH instead
        if (currentWeth && lowerCaseAddress === currentWeth.address.toLowerCase()) {
            return Ether.onChain(currentChainId);
        }

        return KNOWN_SDK_TOKENS[currentChainId]?.[lowerCaseAddress] || undefined;
    }, [pairTokenAddress, currentChainId]);

    const { sdkToken0, sdkToken1 } = useMemo(() => {
        const _sdkToken0 = direction === 'toXtm' ? sdkPairTokenForSwap : xtmTokenForSwap;
        const _sdkToken1 = direction === 'toXtm' ? xtmTokenForSwap : sdkPairTokenForSwap;
        return { sdkToken0: _sdkToken0, sdkToken1: _sdkToken1 };
    }, [sdkPairTokenForSwap, xtmTokenForSwap, direction]);

    const { token0: uiToken0, token1: uiToken1 } = useMemo((): {
        token0: Token | NativeCurrency | undefined;
        token1: Token | NativeCurrency | undefined;
    } => {
        if (!currentChainId) return { token0: undefined, token1: undefined };
        let _uiInputToken: Token | NativeCurrency | undefined;
        let _uiOutputToken: Token | NativeCurrency | undefined;
        let selectedPairSideTokenForSwapUi: Token | NativeCurrency | undefined;

        if (pairTokenAddress === null) {
            // Always use native ETH when no specific token is selected
            selectedPairSideTokenForSwapUi = Ether.onChain(currentChainId);
        } else {
            const currentWeth = WETH9[currentChainId as keyof typeof WETH9];
            const lowerCaseAddress = pairTokenAddress.toLowerCase() as `0x${string}`;

            // If WETH is selected, use native ETH instead
            if (currentWeth && lowerCaseAddress === currentWeth.address.toLowerCase()) {
                selectedPairSideTokenForSwapUi = Ether.onChain(currentChainId);
            } else {
                selectedPairSideTokenForSwapUi = KNOWN_SDK_TOKENS[currentChainId]?.[lowerCaseAddress];
            }
        }
        const _xtmUiToken = xtmTokenForSwap;

        if (direction === 'toXtm') {
            _uiInputToken = selectedPairSideTokenForSwapUi;
            _uiOutputToken = _xtmUiToken;
        } else {
            _uiInputToken = _xtmUiToken;
            _uiOutputToken = selectedPairSideTokenForSwapUi;
        }
        return { token0: _uiInputToken, token1: _uiOutputToken };
    }, [pairTokenAddress, xtmTokenForSwap, direction, currentChainId]);

    useEffect(() => {
        setError(null);
        setInsufficientLiquidity(false);
    }, [sdkToken0, sdkToken1, pairTokenAddress, direction, currentChainId]);

    const { getBestTradeForAmount: getPathfinderTradeDetails } = useUniswapV3Pathfinder({
        currentChainId,
        uiToken0,
        uiToken1,
    });

    const getTradeDetails = useCallback(
        async (
            amountRaw: string,
            amountType: SwapField,
            _feeAmountParamIgnored: FeeAmount = DEFAULT_V3_POOL_FEE,
            signal?: AbortSignal
        ): Promise<V3TradeDetails> => {
            setIsFetchingPool(true);
            setError(null);
            setInsufficientLiquidity(false);

            const result = await getPathfinderTradeDetails(amountRaw, amountType, signal);
            console.info(
                'Pathfinder Result:',
                JSON.stringify(
                    result,
                    (key, value) => (typeof value === 'bigint' ? value.toString() : value), // Convert BigInts to strings for logging
                    2
                )
            );

            setIsFetchingPool(false);
            if (result.error) {
                setError(result.error);
                setInsufficientLiquidity(true);
            }
            if (BigInt(result.tradeDetails?.outputAmount?.quotient?.toString() || '0') === 0n) {
                setInsufficientLiquidity(true);
            }

            return (
                result.tradeDetails || {
                    inputAmount: undefined,
                    outputAmount: undefined,
                    estimatedGasFeeNative: null,
                    minimumReceived: null,
                    executionPrice: null,
                    priceImpactPercent: null,
                    path: [],
                }
            );
        },
        [getPathfinderTradeDetails, setIsFetchingPool, setError, setInsufficientLiquidity]
    );

    const checkAndRequestApproval = useCallback(
        async (
            tokenToApprove: Token,
            amountToApproveRaw: string,
            spenderAddress?: `0x${string}`
        ): Promise<TransactionReceipt | null> => {
            if (abortApproveControllerRef.current) {
                abortApproveControllerRef.current.abort();
            }
            abortApproveControllerRef.current = new AbortController();
            const signal = abortApproveControllerRef.current.signal;

            const spender = spenderAddress || v3RouterAddress;
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
                    receipt = (await approveTx.wait(1)) as TransactionReceipt;
                    if (receipt?.status !== 1) throw new Error('Approval transaction failed on-chain.');
                }
                if (signal?.aborted) throw new Error('Aborted');
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
        [signer, accountAddress, v3RouterAddress, currentChainId, setError, setIsApproving]
    );

    const executeSwap = useCallback(
        async (
            tradeDetailsToExecute: V3TradeDetails,
            _feeAmountIgnored?: FeeAmount
        ): Promise<{ response: TransactionResponse; receipt: TransactionReceipt } | null> => {
            setError(null);
            setIsLoading(true);

            if (
                !signer ||
                !accountAddress ||
                !isConnected ||
                !v3RouterAddress ||
                !currentChainId ||
                !tradeDetailsToExecute.inputAmount ||
                !tradeDetailsToExecute.outputAmount ||
                !tradeDetailsToExecute.minimumReceived ||
                !uiToken0 ||
                !tradeDetailsToExecute.path ||
                tradeDetailsToExecute.path.length === 0
            ) {
                setError('V3 Swap prerequisites not met for execution.');
                setIsLoading(false);
                return null;
            }

            const firstTokenInActualPath = tradeDetailsToExecute.path[0].tokenIn;

            try {
                if (!uiToken0.isNative) {
                    const approvalAmount = BigInt(tradeDetailsToExecute.inputAmount.quotient.toString());
                    const approvalOk = await checkAndRequestApproval(
                        firstTokenInActualPath as Token,
                        approvalAmount.toString()
                    );
                    if (!approvalOk) {
                        setIsLoading(false);
                        return null;
                    }
                }

                const routerContract = new Contract(v3RouterAddress, uniswapV3SwapRouter02Abi, signer);
                const deadline = Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60;
                const txOptions: { value?: bigint; gasLimit?: bigint } = { gasLimit: 200000n };

                if (uiToken0.isNative) {
                    txOptions.value = BigInt(tradeDetailsToExecute.inputAmount.quotient.toString());
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let swapTxResponse: any;
                const path = tradeDetailsToExecute.path;
                const amountInForRouter = BigInt(tradeDetailsToExecute.inputAmount.quotient.toString());
                const amountOutMinForRouter = BigInt(tradeDetailsToExecute.minimumReceived.quotient.toString());

                if (path.length === 1) {
                    const leg = path[0];
                    const params = {
                        tokenIn: leg.tokenIn.address as `0x${string}`,
                        tokenOut: leg.tokenOut.address as `0x${string}`,
                        fee: leg.fee,
                        recipient: accountAddress as `0x${string}`,
                        deadline: BigInt(deadline),
                        amountIn: amountInForRouter,
                        amountOutMinimum: amountOutMinForRouter,
                        sqrtPriceLimitX96: 0n,
                    };
                    try {
                        // MODIFIED GAS ESTIMATION CALL
                        const estimatedGas = await routerContract.exactInputSingle.estimateGas(params, txOptions);
                        txOptions.gasLimit = (BigInt(estimatedGas) * 120n) / 100n;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } catch (gasError: any) {
                        console.warn('Gas estimation failed for exactInputSingle:', gasError.message, gasError);
                        // setError(
                        //     `Gas estimation failed: ${gasError?.reason || gasError?.shortMessage || gasError?.message}`
                        // );
                        setIsLoading(false);
                        // return null;
                    }
                    swapTxResponse = await routerContract.exactInputSingle(params, txOptions);
                } else {
                    // Multi-hop
                    const tokensForPathAddresses: `0x${string}`[] = [path[0].tokenIn.address as `0x${string}`];
                    const feesForPath: FeeAmount[] = [];
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    path.forEach((leg: any) => {
                        tokensForPathAddresses.push(leg.tokenOut.address as `0x${string}`);
                        feesForPath.push(leg.fee);
                    });
                    if (feesForPath.length === tokensForPathAddresses.length) feesForPath.pop();

                    const encodedPath = encodePath(tokensForPathAddresses, feesForPath);
                    const params = {
                        path: encodedPath,
                        recipient: accountAddress as `0x${string}`,
                        deadline: BigInt(deadline),
                        amountIn: amountInForRouter,
                        amountOutMinimum: amountOutMinForRouter,
                    };
                    try {
                        // MODIFIED GAS ESTIMATION CALL
                        const estimatedGas = await routerContract.exactInput.estimateGas(params, txOptions);
                        txOptions.gasLimit = (BigInt(estimatedGas) * 120n) / 100n;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } catch (gasError: any) {
                        console.warn('Gas estimation failed for exactInput (multi-hop):', gasError.message, gasError);
                        // setError(
                        //     `Gas estimation failed: ${gasError?.reason || gasError?.shortMessage || gasError?.message}`
                        // );
                        setIsLoading(false);
                        // return null;
                    }
                    swapTxResponse = await routerContract.exactInput(params, txOptions);
                }

                const swapTxReceipt = (await swapTxResponse.wait(1)) as TransactionReceipt;
                setIsLoading(false);

                if (swapTxReceipt?.status !== 1) {
                    throw new Error('V3 Swap transaction failed on-chain.');
                }
                return { response: swapTxResponse, receipt: swapTxReceipt };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                console.error('Error executing V3 swap transaction:', error);
                setError(`Swap failed: ${error?.reason || error?.shortMessage || error?.message || 'Unknown error'}`);
                setIsLoading(false);
                return null;
            }
        },
        [signer, accountAddress, isConnected, v3RouterAddress, currentChainId, uiToken0, checkAndRequestApproval]
    );

    return {
        pairTokenAddress,
        direction,
        setPairTokenAddress,
        setDirection,
        token0: uiToken0,
        token1: uiToken1,
        sdkToken0,
        sdkToken1,
        isLoading: isLoading || isApproving || isFetchingPool,
        isApproving,
        isFetchingPool,
        error,
        insufficientLiquidity,
        v3RouterAddress,
        checkAndRequestApproval,
        getTradeDetails,
        executeSwap,
        isReady:
            !!publicClient &&
            !!currentChainId &&
            !!v3QuoterAddress &&
            !!v3FactoryAddress &&
            !!signer &&
            !!accountAddress &&
            isConnected &&
            !!v3RouterAddress,
    };
};
