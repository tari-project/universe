/* eslint-disable @typescript-eslint/no-explicit-any */
import { Token, WETH9, Ether, NativeCurrency, CurrencyAmount } from '@uniswap/sdk-core';
import { encodeSqrtRatioX96, FeeAmount, TickMath } from '@uniswap/v3-sdk';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import {
    Contract,
    Signer as EthersSigner,
    TransactionResponse,
    TransactionReceipt,
    zeroPadValue,
    TransactionRequest,
} from 'ethers';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { erc20Abi, parseUnits, PublicClient as ViemPublicClient, zeroAddress } from 'viem';

import {
    QUOTER_ADDRESSES_V3,
    XTM_SDK_TOKEN,
    KNOWN_SDK_TOKENS,
    DEADLINE_MINUTES,
    nonfungiblePositionManagerAbi,
    FACTORY_ADDRESSES_V3,
    uniswapV3FactoryAbi,
    NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
    V3_SWAP_ROUTER_ADDRESS,
    swapRouter02AbiJson,
} from './lib/constants';
import { encodePath as encodeV3Path, walletClientToSigner } from './lib/utils';
import { V3TradeDetails, SwapField, SwapDirection } from './lib/types';
import { useConfigCoreStore } from '@app/store';
import { useUniswapV3Pathfinder } from './useUniswapV3Pathfinder';
import { sendTransactionWithWagmiSigner, TransactionState } from './lib/providers';

export const useUniswapV3Interactions = () => {
    const [pairTokenAddress, setPairTokenAddress] = useState<`0x${string}` | null>(null);
    const [direction, setDirection] = useState<SwapDirection>('toXtm');
    const [isLoadingHook, setIsLoadingHook] = useState(false);
    const [errorHook, setErrorHook] = useState<string | null>(null);
    const [insufficientLiquidityHook, setInsufficientLiquidityHook] = useState(false);
    const [isApprovingHook, setIsApprovingHook] = useState(false);
    const [isFetchingPoolHook, setIsFetchingPoolHook] = useState(false);

    const { address: accountAddress, isConnected, chain } = useAccount();
    const { data: walletClient } = useWalletClient();

    const defaultChainId = useConfigCoreStore((s) => s.default_chain);
    const currentChainId = useMemo(() => chain?.id || defaultChainId, [chain?.id, defaultChainId]);
    const publicClient = usePublicClient({ chainId: currentChainId }) as ViemPublicClient;

    const quoterAddressV3 = useMemo(
        () => (currentChainId ? QUOTER_ADDRESSES_V3[currentChainId] : undefined),
        [currentChainId]
    );

    const v3SwapRouter02Address = useMemo(
        // For the V3 SwapRouter02
        () => (currentChainId ? V3_SWAP_ROUTER_ADDRESS[currentChainId] : undefined),
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
                if (!cancelled) setSigner(s);
            } else if (!cancelled) setSigner(null);
        })();
        return () => {
            cancelled = true;
        };
    }, [walletClient]);

    const sdkPairTokenForSwap = useMemo(() => {
        if (!currentChainId) return undefined;
        if (pairTokenAddress === null) return Ether.onChain(currentChainId);
        const lowerCaseAddress = pairTokenAddress.toLowerCase() as `0x${string}`;
        const currentWeth = WETH9[currentChainId as keyof typeof WETH9];
        if (currentWeth && lowerCaseAddress === currentWeth.address.toLowerCase()) {
            return Ether.onChain(currentChainId);
        }
        return KNOWN_SDK_TOKENS[currentChainId]?.[lowerCaseAddress] || undefined;
    }, [pairTokenAddress, currentChainId]);

    const [sdkToken0, setSdkToken0] = useState<Token | undefined>(undefined);
    const [sdkToken1, setSdkToken1] = useState<Token | undefined>(undefined);

    useEffect(() => {
        if (!currentChainId) return;
        let _uiInputToken: Token | NativeCurrency | undefined;
        let _uiOutputToken: Token | NativeCurrency | undefined;
        let selectedPairSideTokenForSwapUi: Token | NativeCurrency | undefined;

        if (pairTokenAddress === null) {
            selectedPairSideTokenForSwapUi = Ether.onChain(currentChainId);
        } else {
            const currentWeth = WETH9[currentChainId as keyof typeof WETH9];
            const lowerCaseAddress = pairTokenAddress.toLowerCase() as `0x${string}`;
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
        setSdkToken0(_uiInputToken as Token);
        setSdkToken1(_uiOutputToken as Token);
    }, [currentChainId, direction, pairTokenAddress, sdkPairTokenForSwap, xtmTokenForSwap]);

    useEffect(() => {
        setErrorHook(null);
        setInsufficientLiquidityHook(false);
    }, [sdkToken0, sdkToken1, pairTokenAddress, direction, currentChainId]);

    const { getBestTradeForAmount: getPathfinderTradeDetails } = useUniswapV3Pathfinder({
        currentChainId,
        uiToken0: sdkToken0,
        uiToken1: sdkToken1,
    });

    const getTradeDetails = useCallback(
        async (amountRaw: string, amountType: SwapField, signal?: AbortSignal): Promise<V3TradeDetails> => {
            setIsFetchingPoolHook(true);
            setErrorHook(null);
            setInsufficientLiquidityHook(false);
            const result = await getPathfinderTradeDetails(amountRaw, amountType, signal);
            setIsFetchingPoolHook(false);
            if (result.error) {
                setErrorHook(result.error);
                setInsufficientLiquidityHook(true);
            }
            const outputAmountQuotient = result.tradeDetails?.outputAmount?.quotient;
            if (outputAmountQuotient === undefined || BigInt(outputAmountQuotient.toString()) === 0n) {
                if (!result.error) setInsufficientLiquidityHook(true);
            }

            const defaultInputCurrency = sdkToken0 || (currentChainId ? Ether.onChain(currentChainId) : undefined);
            const defaultOutputCurrency = sdkToken1 || (currentChainId ? Ether.onChain(currentChainId) : undefined);

            const defaultTrade: V3TradeDetails = {
                inputToken: defaultInputCurrency!,
                outputToken: defaultOutputCurrency!,
                inputAmount: defaultInputCurrency
                    ? CurrencyAmount.fromRawAmount(defaultInputCurrency, '0')
                    : undefined!,
                outputAmount: defaultOutputCurrency
                    ? CurrencyAmount.fromRawAmount(defaultOutputCurrency, '0')
                    : undefined!,
                minimumReceived: defaultOutputCurrency
                    ? CurrencyAmount.fromRawAmount(defaultOutputCurrency, '0')
                    : undefined!,
                executionPrice: undefined!,
                priceImpactPercent: null,
                estimatedGasFeeNative: null,
                path: [],
            };
            return result.tradeDetails || defaultTrade;
        },
        [getPathfinderTradeDetails, sdkToken0, currentChainId, sdkToken1]
    );

    const approveTokenForV3Router02 = useCallback(
        async (token: Token, amount: bigint, spender: string) => {
            if (!signer || !accountAddress) throw new Error('Wallet not connected for approval');
            setIsApprovingHook(true);
            setErrorHook(null);
            try {
                const tokenContract = new Contract(token.address, erc20Abi, signer);
                const currentAllowance = await tokenContract.allowance(accountAddress, spender);
                if (BigInt(currentAllowance.toString()) < amount) {
                    const approveTxPopulated = await tokenContract.approve.populateTransaction(spender, amount);
                    const approveResult = await sendTransactionWithWagmiSigner(signer, approveTxPopulated);
                    if (approveResult.state !== TransactionState.Sent || !approveResult.receipt) {
                        throw new Error(`Approval for ${token.symbol} failed or receipt not found.`);
                    }
                    console.info(`${token.symbol} approved for V3SwapRouter02`);
                } else {
                    console.info(`Sufficient allowance for ${token.symbol} already exists for V3SwapRouter02`);
                }
                setIsApprovingHook(false);
                return true;
            } catch (e: any) {
                console.error(`Approval error for ${token.symbol}:`, e);
                setErrorHook(`Approval failed: ${e.message || 'Unknown error'}`);
                setIsApprovingHook(false);
                return false;
            }
        },
        [signer, accountAddress]
    );

    const executeSwapWithV3Router02 = useCallback(
        async (
            tradeDetails: V3TradeDetails,
            onApprove?: () => void
        ): Promise<{ response: TransactionResponse; receipt: TransactionReceipt } | null> => {
            setErrorHook(null);
            setIsLoadingHook(true);

            const inputCurrency = tradeDetails?.inputAmount?.currency;
            const amountInRaw = tradeDetails?.inputAmount?.quotient;
            const amountOutMinRaw = tradeDetails?.minimumReceived?.quotient;

            if (
                !signer ||
                !accountAddress ||
                !isConnected ||
                !v3SwapRouter02Address ||
                !currentChainId ||
                !inputCurrency ||
                !amountInRaw ||
                !amountOutMinRaw ||
                !tradeDetails.path ||
                tradeDetails.path.length === 0
            ) {
                setErrorHook('Swap (V3Router02) prerequisites not met.');
                setIsLoadingHook(false);
                onApprove?.();
                return null;
            }

            const routerContract = new Contract(v3SwapRouter02Address, swapRouter02AbiJson, signer);
            const deadline = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60);
            const txOptions: { value?: bigint; gasLimit?: bigint } = {};

            const amountInBigInt = BigInt(amountInRaw.toString());
            const amountOutMinBigInt = BigInt(amountOutMinRaw.toString());

            try {
                // Handle Approval if input is ERC20
                if (!inputCurrency.isNative) {
                    const approvalSuccess = await approveTokenForV3Router02(
                        inputCurrency as Token,
                        amountInBigInt,
                        v3SwapRouter02Address
                    );
                    if (!approvalSuccess) {
                        setIsLoadingHook(false);
                        return null;
                    }
                }

                onApprove?.();

                // Handle ETH value if input is native ETH
                if (inputCurrency.isNative) {
                    txOptions.value = amountInBigInt;
                }

                let populatedTx: TransactionRequest;

                if (tradeDetails.path.length === 1) {
                    // Single hop swap
                    const leg = tradeDetails.path[0];
                    const params = {
                        tokenIn: leg.tokenIn.wrapped.address as `0x${string}`,
                        tokenOut: leg.tokenOut.wrapped.address as `0x${string}`,
                        fee: leg.fee as FeeAmount,
                        recipient: accountAddress as `0x${string}`,
                        deadline: deadline,
                        amountIn: amountInBigInt,
                        amountOutMinimum: amountOutMinBigInt,
                        sqrtPriceLimitX96: 0n, // Typically 0 for no limit
                    };
                    console.info('[V3SwapRouter02] exactInputSingle params:', params);
                    populatedTx = await routerContract.exactInputSingle.populateTransaction(params, txOptions);
                } else {
                    // Multi-hop swap
                    const pathBytes = encodeV3Path(
                        tradeDetails.path
                            .map((leg) => leg.tokenIn.wrapped.address as `0x${string}`)
                            .concat(
                                tradeDetails.path[tradeDetails.path.length - 1].tokenOut.wrapped
                                    .address as `0x${string}`
                            ),
                        tradeDetails.path.map((leg) => leg.fee as FeeAmount)
                    );
                    const params = {
                        path: pathBytes,
                        recipient: accountAddress as `0x${string}`,
                        deadline: deadline,
                        amountIn: amountInBigInt,
                        amountOutMinimum: amountOutMinBigInt,
                    };
                    populatedTx = await routerContract.exactInput.populateTransaction(params, txOptions);
                }

                try {
                    const estimatedGas = await signer.estimateGas(populatedTx);
                    populatedTx.gasLimit = (estimatedGas * 120n) / 100n; // 20% buffer
                } catch (gasError: any) {
                    console.warn('[V3SwapRouter02] Gas estimation failed:', gasError);
                    populatedTx.gasLimit = inputCurrency.isNative ? 200000n : 300000n; // Fallback
                }

                const txResult = await sendTransactionWithWagmiSigner(signer, populatedTx);
                setIsLoadingHook(false);

                if (txResult.state === TransactionState.Sent && txResult.receipt && txResult.response) {
                    console.info('[V3SwapRouter02] Swap successful!');
                    return { response: txResult.response, receipt: txResult.receipt };
                } else {
                    setErrorHook(
                        txResult.receipt
                            ? 'Swap (V3Router02) transaction failed on-chain.'
                            : 'Swap (V3Router02) transaction submission failed.'
                    );
                    return null;
                }
            } catch (error: any) {
                let message = 'Unknown error executing V3Router02 swap.';
                if (error.reason) message = `Swap failed: ${error.reason}`;
                else if (error.data?.message) message = `Swap failed: ${error.data.message}`;
                else if (error.message) message = `Swap failed: ${error.message}`;
                setErrorHook(message);
                setIsLoadingHook(false);
                setIsApprovingHook(false);
                return null;
            }
        },
        [signer, accountAddress, isConnected, v3SwapRouter02Address, currentChainId, approveTokenForV3Router02]
    );

    const addLiquidityAndCreatePoolIfNeeded = useCallback(async () => {
        setErrorHook(null);
        setIsLoadingHook(true);
        setIsApprovingHook(false);

        const fee = FeeAmount.LOW;
        const tickSpacing = 10;
        const minTick = Math.ceil(TickMath.MIN_TICK / tickSpacing) * tickSpacing;
        const maxTick = Math.floor(TickMath.MAX_TICK / tickSpacing) * tickSpacing;
        const tickLower = minTick; // Full range for testing
        const tickUpper = maxTick; // Full range for testing
        const amountUiToken0DesiredStr = '10000';
        const amountUiToken1DesiredStr = '10000000';
        const amountUiToken0MinStr = '10000';
        const amountUiToken1MinStr = '10000';

        const finalRecipient = accountAddress;

        if (!sdkToken0 || !sdkToken1 || !currentChainId || !signer || !accountAddress || !publicClient) {
            setErrorHook('Core prerequisites (tokens, chain, signer, account) not available.');
            setIsLoadingHook(false);
            return { state: TransactionState.Failed };
        }

        const nftPositionManagerAddr = currentChainId
            ? NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[currentChainId]
            : undefined;
        const factoryAddr = currentChainId ? FACTORY_ADDRESSES_V3[currentChainId] : undefined;

        if (!nftPositionManagerAddr || !nonfungiblePositionManagerAbi || !factoryAddr || !uniswapV3FactoryAbi) {
            setErrorHook('NFTPM or Factory address/ABI not configured for the current chain.');
            setIsLoadingHook(false);
            return { state: TransactionState.Failed };
        }

        if (tickLower >= tickUpper) {
            setErrorHook('tickLower must be less than tickUpper.');
            setIsLoadingHook(false);
            return { state: TransactionState.Failed };
        }
        if (tickLower % tickSpacing !== 0 || tickUpper % tickSpacing !== 0) {
            setErrorHook(`Ticks must be multiples of tickSpacing (${tickSpacing} for fee ${fee}).`);
            setIsLoadingHook(false);
            return { state: TransactionState.Failed };
        }

        const nftpmContract = new Contract(nftPositionManagerAddr, nonfungiblePositionManagerAbi, signer);
        let createPoolResponse: TransactionResponse | undefined;
        let createPoolReceipt: TransactionReceipt | undefined;
        let mintResponse: TransactionResponse | undefined;
        let mintReceipt: TransactionReceipt | undefined;
        let nftTokenId: bigint | undefined;

        try {
            // --- Determine actual token order for the pool (tokenA address < tokenB address) ---
            const [tokenA_pool, tokenB_pool] = sdkToken0.wrapped.sortsBefore(sdkToken1.wrapped)
                ? [sdkToken0, sdkToken1]
                : [sdkToken1, sdkToken0];

            // --- Convert desired and min amounts based on sorted pool tokens ---
            const amountADesired_pool = parseUnits(
                tokenA_pool.equals(sdkToken0) ? amountUiToken0DesiredStr : amountUiToken1DesiredStr,
                tokenA_pool.decimals
            );
            const amountBDesired_pool = parseUnits(
                tokenB_pool.equals(sdkToken0) ? amountUiToken0DesiredStr : amountUiToken1DesiredStr,
                tokenB_pool.decimals
            );
            const amountAMin_pool = parseUnits(
                tokenA_pool.equals(sdkToken0) ? amountUiToken0MinStr : amountUiToken1MinStr,
                tokenA_pool.decimals
            );
            const amountBMin_pool = parseUnits(
                tokenB_pool.equals(sdkToken0) ? amountUiToken0MinStr : amountUiToken1MinStr,
                tokenB_pool.decimals
            );

            // --- Check if pool exists ---
            const factoryContract = new Contract(factoryAddr, uniswapV3FactoryAbi, signer.provider); // Use provider for read
            console.info(
                `[AddLiq] Checking pool for: ${tokenA_pool.wrapped.address}, ${tokenB_pool.wrapped.address}, fee: ${fee}`
            );
            const poolAddressOnFactory = await factoryContract.getPool(
                tokenA_pool.wrapped.address,
                tokenB_pool.wrapped.address,
                fee
            );
            console.info(`[AddLiq] Fetched pool address from factory: ${poolAddressOnFactory}`);

            if (poolAddressOnFactory === zeroAddress) {
                setIsLoadingHook(true);
                setErrorHook('Pool does not exist. Attempting to create and initialize...');

                if (amountADesired_pool === 0n || amountBDesired_pool === 0n) {
                    setErrorHook(
                        'Both desired amounts must be greater than 0 to initialize a new pool with a price based on their ratio.'
                    );
                    setIsLoadingHook(false);
                    return { state: TransactionState.Failed };
                }
                // Calculate sqrtPriceX96 for initialization based on the ratio of desired amounts
                const sqrtPriceX96 = encodeSqrtRatioX96(amountBDesired_pool.toString(), amountADesired_pool.toString());
                console.info(
                    `[AddLiq] Pool does not exist. Initializing with sqrtPriceX96: ${sqrtPriceX96.toString()} based on desired amounts ratio.`
                );

                const createPoolPopulatedTx =
                    await nftpmContract.createAndInitializePoolIfNecessary.populateTransaction(
                        tokenA_pool.wrapped.address,
                        tokenB_pool.wrapped.address,
                        fee,
                        BigInt(sqrtPriceX96.toString())
                    );

                try {
                    const estimatedGas = await signer.estimateGas(createPoolPopulatedTx);
                    createPoolPopulatedTx.gasLimit = (estimatedGas * 120n) / 100n;
                } catch (gasError: any) {
                    console.warn('[AddLiq] Gas estimation failed for createAndInitializePoolIfNecessary:', gasError);
                    setErrorHook(`Gas Est Fail (Create Pool): ${gasError.reason || gasError.message}`);
                    setIsLoadingHook(false);
                    return { state: TransactionState.Failed };
                }

                const createPoolTxResult = await sendTransactionWithWagmiSigner(signer, createPoolPopulatedTx);
                createPoolResponse = createPoolTxResult.response;
                createPoolReceipt = createPoolTxResult.receipt;

                if (createPoolTxResult.state !== TransactionState.Sent || !createPoolReceipt) {
                    setErrorHook('Pool creation transaction failed or receipt not found.');
                    setIsLoadingHook(false);
                    return { state: TransactionState.Failed, createPoolResponse, createPoolReceipt };
                }
                setErrorHook(null);
                console.info('[AddLiq] Pool created and initialized successfully.');
            } else {
                console.info('[AddLiq] Pool already exists at:', poolAddressOnFactory);
            }

            // --- Approvals for NFTPM ---
            setIsLoadingHook(true); // For approvals and mint
            setIsApprovingHook(true);
            const tokensToApproveInfo: { token: Token; amount: bigint }[] = [];
            if (!tokenA_pool.isNative && amountADesired_pool > 0n) {
                tokensToApproveInfo.push({ token: tokenA_pool as Token, amount: amountADesired_pool });
            }
            if (!tokenB_pool.isNative && amountBDesired_pool > 0n) {
                tokensToApproveInfo.push({ token: tokenB_pool as Token, amount: amountBDesired_pool });
            }

            for (const { token, amount } of tokensToApproveInfo) {
                const tokenContract = new Contract(token.address, erc20Abi, signer);
                try {
                    const currentAllowance = await tokenContract.allowance(accountAddress, nftPositionManagerAddr);
                    if (BigInt(currentAllowance.toString()) < amount) {
                        console.info(`[AddLiq] Approving ${amount.toString()} of ${token.symbol} for NFTPM...`);
                        const approveTxPopulated = await tokenContract.approve.populateTransaction(
                            nftPositionManagerAddr,
                            amount
                        );
                        try {
                            const estimatedGas = await signer.estimateGas(approveTxPopulated);
                            approveTxPopulated.gasLimit = (estimatedGas * 120n) / 100n;
                        } catch (gasError) {
                            console.warn(`[AddLiq] Gas estimation failed for ${token.symbol} approval, using default`);
                            console.error(gasError);
                            approveTxPopulated.gasLimit = 100000n;
                        }
                        const approveTxResult = await sendTransactionWithWagmiSigner(signer, approveTxPopulated);
                        if (approveTxResult.state !== TransactionState.Sent || !approveTxResult.receipt) {
                            throw new Error(`Approval failed for ${token.symbol}`);
                        }
                        console.info(`[AddLiq] Approved ${token.symbol}`);
                    } else {
                        console.info(`[AddLiq] Sufficient allowance already exists for ${token.symbol}`);
                    }
                } catch (approvalError: any) {
                    console.error(`[AddLiq] Approval error for ${token.symbol}:`, approvalError);
                    setIsApprovingHook(false);
                    throw new Error(`Failed to approve ${token.symbol}: ${approvalError.message || approvalError}`);
                }
            }
            setIsApprovingHook(false);

            // --- ETH Value for Mint ---
            let ethValueForMint = 0n;
            if (tokenA_pool.isNative && amountADesired_pool > 0n) ethValueForMint = amountADesired_pool;
            else if (tokenB_pool.isNative && amountBDesired_pool > 0n) ethValueForMint = amountBDesired_pool;

            // --- Mint Parameters ---
            const mintParamsForManager = {
                token0: tokenA_pool.wrapped.address,
                token1: tokenB_pool.wrapped.address,
                fee: fee,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: amountADesired_pool,
                amount1Desired: amountBDesired_pool,
                amount0Min: amountAMin_pool,
                amount1Min: amountBMin_pool,
                recipient: finalRecipient as `0x${string}`,
                deadline: BigInt(Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60),
            };
            console.info(
                '[AddLiq] Minting with params:',
                JSON.stringify(mintParamsForManager, (_, v) => (typeof v === 'bigint' ? v.toString() : v))
            );

            const mintPopulatedTx = await nftpmContract.mint.populateTransaction(mintParamsForManager, {
                value: ethValueForMint > 0n ? ethValueForMint : undefined,
            });

            try {
                const estimatedGas = await signer.estimateGas(mintPopulatedTx);
                mintPopulatedTx.gasLimit = (estimatedGas * 130n) / 100n;
            } catch (gasError: any) {
                console.warn('[AddLiq] Gas estimation failed for NFTPM mint:', gasError);
                mintPopulatedTx.gasLimit = 700000n; // Increased fallback for mint
            }

            const mintTxResult = await sendTransactionWithWagmiSigner(signer, mintPopulatedTx);
            mintResponse = mintTxResult.response;
            mintReceipt = mintTxResult.receipt;
            setIsLoadingHook(false);

            if (mintTxResult.state === TransactionState.Sent && mintReceipt) {
                console.info('[AddLiq] Liquidity minted successfully!');
                try {
                    const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
                    const mintEventLog = mintReceipt.logs.find(
                        (log) =>
                            log.address.toLowerCase() === nftPositionManagerAddr?.toLowerCase() &&
                            log.topics[0] === transferTopic && // Transfer event
                            log.topics[1].toLowerCase() ===
                                zeroPadValue('0x0000000000000000000000000000000000000000', 32).toLowerCase() && // From zero address
                            log.topics[2].toLowerCase() === zeroPadValue(finalRecipient!, 32).toLowerCase() // To recipient
                    );
                    if (mintEventLog && mintEventLog.topics[3]) {
                        nftTokenId = BigInt(mintEventLog.topics[3]);
                        console.info(`[AddLiq] Minted NFT ID: ${nftTokenId}`);
                    }
                } catch (parseError) {
                    console.warn('[AddLiq] Could not parse tokenId from mint receipt logs:', parseError);
                }
                return {
                    state: TransactionState.Sent,
                    createPoolResponse,
                    createPoolReceipt,
                    mintResponse,
                    mintReceipt,
                    nftTokenId,
                };
            } else {
                const errorMsg = mintReceipt
                    ? 'Mint transaction failed on-chain (NFTPM).'
                    : 'Mint transaction submission failed (NFTPM).';
                setErrorHook(errorMsg);
                return {
                    state: TransactionState.Failed,
                    createPoolResponse,
                    createPoolReceipt,
                    mintResponse,
                    mintReceipt,
                };
            }
        } catch (error: any) {
            console.error('[AddLiq] Error in addLiquidityAndCreatePoolIfNeeded:', error);
            let errorMessage = 'An error occurred during add liquidity.';
            if (error.message) errorMessage = error.message;
            else if (error.reason) errorMessage = error.reason;
            else if (error.code) errorMessage = `Transaction failed with code: ${error.code}`;
            setErrorHook(errorMessage);
            setIsLoadingHook(false);
            setIsApprovingHook(false);
            return {
                state: TransactionState.Failed,
                createPoolResponse,
                createPoolReceipt,
                mintResponse,
                mintReceipt,
            };
        }
    }, [sdkToken0, sdkToken1, accountAddress, currentChainId, signer, publicClient]);

    return {
        addLiquidityV3: addLiquidityAndCreatePoolIfNeeded,
        pairTokenAddress,
        direction,
        setPairTokenAddress,
        setDirection,
        token0: sdkToken0,
        token1: sdkToken1,
        isLoading: isLoadingHook,
        isApproving: isApprovingHook,
        isFetchingPool: isFetchingPoolHook,
        error: errorHook,
        insufficientLiquidity: insufficientLiquidityHook,
        getTradeDetails,
        executeSwap: executeSwapWithV3Router02,
        executeSwapWithV3Router02,
        isReady: !!publicClient && !!currentChainId && !!quoterAddressV3 && !!signer && !!accountAddress && isConnected,
    };
};
