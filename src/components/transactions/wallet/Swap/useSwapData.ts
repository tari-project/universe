/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAccount, useBalance, useReadContracts } from 'wagmi';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToastStore } from '@app/components/ToastStack/useToastStore';
import { formatUnits as viemFormatUnits, parseUnits as viemParseUnits, erc20Abi as viemErc20Abi } from 'viem';
import { Token, NativeCurrency, Ether } from '@uniswap/sdk-core';
import {
    ENABLED_TOKEN_ADDRESSES,
    EnabledTokensEnum,
    TOKEN_DEFINITIONS,
    XTM_SDK_TOKEN,
} from '@app/hooks/swap/lib/constants';
import { SwapField, SwapTransaction, V3TradeDetails } from '@app/hooks/swap/lib/types';
import { useConfigCoreStore } from '@app/store';
import {
    fetchTokenPriceUSD,
    formatAmountSmartly,
    formatDisplayBalanceForSelectable,
    formatNativeGasFee as utilFormatNativeGasFee,
} from '@app/hooks/swap/lib/utils';
import { useTokenDisplayInfo } from './helpers/useTokenInfo';
import { useUniswapV3Interactions } from '@app/hooks/swap/useSwapV3';

export type TokenSymbol = EnabledTokensEnum;
export interface SelectableTokenInfo {
    label: string;
    symbol: TokenSymbol;
    address: `0x${string}` | null;
    iconSymbol: string;
    definition: Token | NativeCurrency;
    balance?: string;
    usdValue?: string;
    rawBalance?: bigint;
    decimals: number;
    pricePerTokenUSD?: number;
}

export const useSwapData = () => {
    const connectedAccount = useAccount();
    const addToast = useToastStore((s) => s.addToast);

    const [ethTokenAmount, setEthTokenAmount] = useState<string>('1');
    const [wxtmAmount, setWxtmAmount] = useState<string>('');
    const [lastUpdatedField, setLastUpdatedField] = useState<SwapField>('ethTokenField');

    const [reviewSwap, setReviewSwap] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [processingOpen, setProcessingOpen] = useState(false);
    // isProcessingApproval can now represent "isSigningPermit" or general pre-swap processing
    const [isProcessingApproval, setIsProcessingApproval] = useState(false);
    const [isProcessingSwap, setIsProcessingSwap] = useState(false);
    const [swapSuccess, setSwapSuccess] = useState(false);
    const [tokenSelectOpen, setTokenSelectOpen] = useState(false);

    const [priceImpact, setPriceImpact] = useState<string | null>(null);
    const [networkFee, setNetworkFee] = useState<string | null>(null);
    const [slippage, setSlippage] = useState<string | null>(null);
    const [transactionId, setTransactionId] = useState<string | null>(null);
    // We won't have separate approval and swap fees if using Permit2 for all ERC20s in a single tx
    const [paidTransactionFee, setPaidTransactionFee] = useState<string | null>(null);
    const [txBlockHash, setTxBlockHash] = useState<`0x${string}` | null>(null);
    const [swapError, setSwapError] = useState<string | null>(null);
    const [minimumReceivedDisplay, setMinimumReceivedDisplay] = useState<string | null>(null);
    const [executionPriceDisplay, setExecutionPriceDisplay] = useState<string | null>(null);

    const [tradeDetails, setTradeDetails] = useState<V3TradeDetails | null>(null);
    const defaultChainId = useConfigCoreStore((s) => s.default_chain);
    const [customError, setCustomError] = useState<string | null>(null);

    const abortController = useRef<AbortController | null>(null);

    const {
        direction,
        token0: swapEngineInputToken,
        token1: swapEngineOutputToken,
        // sdkToken0, // Not directly used in this UI layer logic
        // sdkToken1, // Not directly used in this UI layer logic
        setDirection: setSwapEngineDirection,
        setPairTokenAddress,
        getTradeDetails,
        // checkAndRequestApproval, // No longer called directly from here
        executeSwap,
        insufficientLiquidity,
        error: useSwapError, // This is error from useUniswapV3Interactions
        isLoading: isSwapEngineLoading, // Loading state from useUniswapV3Interactions
        isApproving: isSwapEngineApproving, // isSigningPermit state from useUniswapV3Interactions
    } = useUniswapV3Interactions();

    const currentChainId = useMemo(() => connectedAccount.chain?.id, [connectedAccount.chain]);

    const fromUiTokenDefinition = useMemo(
        () => (direction === 'toXtm' ? swapEngineInputToken : swapEngineOutputToken),
        [direction, swapEngineInputToken, swapEngineOutputToken]
    );
    const toUiTokenDefinition = useMemo(
        () => (direction === 'toXtm' ? swapEngineOutputToken : swapEngineInputToken),
        [direction, swapEngineInputToken, swapEngineOutputToken]
    );

    const {
        tokenDisplayInfo: fromTokenDisplay,
        isLoading: isLoadingFromBalance,
        refetch: refetchFromToken,
    } = useTokenDisplayInfo({
        uiTokenDefinition: fromUiTokenDefinition, // No need to cast if type is Token | NativeCurrency | undefined
        chainId: currentChainId || defaultChainId,
        accountAddress: connectedAccount.address,
        fallbackDefinition: currentChainId ? Ether.onChain(currentChainId) : undefined, // WETH9 changed to Ether for native
    });

    const {
        tokenDisplayInfo: toTokenDisplay,
        isLoading: isLoadingToBalance,
        refetch: refetchToToken,
    } = useTokenDisplayInfo({
        uiTokenDefinition: toUiTokenDefinition, // No need to cast
        chainId: currentChainId || defaultChainId,
        accountAddress: connectedAccount.address,
        fallbackDefinition: currentChainId ? XTM_SDK_TOKEN[currentChainId] : undefined,
    });

    const handleRefetchBalances = useCallback(async () => {
        await Promise.all([refetchFromToken(), refetchToToken()]);
    }, [refetchFromToken, refetchToToken]);

    const notEnoughBalance = useMemo(() => {
        if (direction === 'toXtm') {
            if (!fromTokenDisplay?.rawBalance || !ethTokenAmount || !fromTokenDisplay.decimals) return false;
            try {
                const amountBigInt = viemParseUnits(ethTokenAmount, fromTokenDisplay.decimals);
                return amountBigInt > fromTokenDisplay.rawBalance;
            } catch {
                return true;
            }
        } else {
            if (!toTokenDisplay?.rawBalance || !wxtmAmount || !toTokenDisplay.decimals) return false;
            try {
                const amountBigInt = viemParseUnits(wxtmAmount, toTokenDisplay.decimals);
                return amountBigInt > toTokenDisplay.rawBalance;
            } catch {
                return true;
            }
        }
    }, [
        direction,
        fromTokenDisplay?.rawBalance,
        fromTokenDisplay?.decimals,
        ethTokenAmount,
        toTokenDisplay?.rawBalance,
        toTokenDisplay?.decimals,
        wxtmAmount,
    ]);

    const baseSelectableTokensForList = useMemo((): Omit<
        SelectableTokenInfo,
        'balance' | 'usdValue' | 'rawBalance' | 'pricePerTokenUSD'
    >[] => {
        const chainId = currentChainId || defaultChainId;
        const xtmDef = XTM_SDK_TOKEN[chainId];
        const tokens: Omit<SelectableTokenInfo, 'balance' | 'usdValue' | 'rawBalance' | 'pricePerTokenUSD'>[] = [];

        Object.keys(ENABLED_TOKEN_ADDRESSES).forEach((tokenId) => {
            const token = TOKEN_DEFINITIONS[tokenId as EnabledTokensEnum]?.[chainId];
            if (token) {
                tokens.push({
                    label: token.name || 'Token',
                    symbol: token.symbol as TokenSymbol,
                    address: token.address as `0x${string}`,
                    iconSymbol: token.symbol?.toLowerCase() || token.address.toLowerCase(),
                    definition: token,
                    decimals: token.decimals,
                });
            }
        });

        const nativeEth = Ether.onChain(chainId);
        if (nativeEth && (!xtmDef || !nativeEth.equals(xtmDef))) {
            const symbol = nativeEth?.symbol?.toUpperCase() as TokenSymbol;
            const iconSymbol = nativeEth?.symbol?.toLowerCase();
            if (symbol && iconSymbol) {
                tokens.push({
                    label: nativeEth.name || 'Ethereum',
                    symbol,
                    address: null,
                    iconSymbol,
                    definition: nativeEth,
                    decimals: nativeEth.decimals,
                });
            }
        }

        Object.values(EnabledTokensEnum).forEach((tokenKey) => {
            let tokenDefinitionFromEnum: Token | undefined;
            if (tokenKey === EnabledTokensEnum.WXTM) tokenDefinitionFromEnum = xtmDef;

            if (tokenDefinitionFromEnum?.address) {
                if (!tokens.find((t) => t.definition.equals(tokenDefinitionFromEnum!))) {
                    tokens.push({
                        label: tokenDefinitionFromEnum.name || tokenKey,
                        symbol: (tokenDefinitionFromEnum.symbol || tokenKey) as TokenSymbol,
                        address: tokenDefinitionFromEnum.address as `0x${string}`,
                        iconSymbol: tokenDefinitionFromEnum.symbol?.toLowerCase() || tokenKey.toLowerCase(),
                        definition: tokenDefinitionFromEnum,
                        decimals: tokenDefinitionFromEnum.decimals,
                    });
                }
            }
        });
        return tokens;
    }, [currentChainId, defaultChainId]);

    const selectableTokensContracts = useMemo(() => {
        if (!connectedAccount.address || baseSelectableTokensForList.length === 0) return [];
        return baseSelectableTokensForList
            .filter((token) => token.address !== null)
            .map(
                (token) =>
                    ({
                        address: token.address as `0x${string}`,
                        abi: viemErc20Abi,
                        functionName: 'balanceOf',
                        args: [connectedAccount.address as `0x${string}`],
                    }) as const
            );
    }, [connectedAccount.address, baseSelectableTokensForList]);

    const { data: erc20BalancesData, isLoading: isLoadingErc20Balances } = useReadContracts({
        contracts: selectableTokensContracts,
        allowFailure: true,
        query: { enabled: selectableTokensContracts.length > 0 && !!connectedAccount.address },
    });

    const { data: nativeTokenBalanceDataForList, isLoading: isLoadingNativeForList } = useBalance({
        address: connectedAccount.address,
        chainId: currentChainId,
    });

    const [tokenPrices, setTokenPrices] = useState<Record<string, number | undefined>>({});
    const [isLoadingPrices, setIsLoadingPrices] = useState(false);

    useEffect(() => {
        const fetchAllPrices = async () => {
            if (baseSelectableTokensForList.length === 0 || !currentChainId) return;
            setIsLoadingPrices(true);
            const newPrices: Record<string, number | undefined> = {};
            const promises = baseSelectableTokensForList.map(async (token) => {
                if (token.symbol) {
                    // Ensure symbol exists
                    newPrices[token.symbol] = await fetchTokenPriceUSD(token.symbol, currentChainId);
                }
            });
            await Promise.all(promises);
            setTokenPrices((prev) => ({ ...prev, ...newPrices }));
            setIsLoadingPrices(false);
        };
        fetchAllPrices();
    }, [baseSelectableTokensForList, currentChainId]);

    const selectableFromTokens = useMemo((): SelectableTokenInfo[] => {
        return baseSelectableTokensForList
            .map((baseToken) => {
                let rawBalance: bigint | undefined;
                let balanceStr: string | undefined;

                if (baseToken.address === null) {
                    rawBalance = nativeTokenBalanceDataForList?.value;
                    balanceStr = rawBalance
                        ? formatDisplayBalanceForSelectable(rawBalance, baseToken.decimals, baseToken.symbol)
                        : undefined;
                } else {
                    const contractIndex = selectableTokensContracts.findIndex(
                        (c) => c.address.toLowerCase() === baseToken.address?.toLowerCase()
                    );
                    const balanceResult =
                        contractIndex !== -1 && erc20BalancesData ? erc20BalancesData[contractIndex] : undefined;
                    if (balanceResult?.status === 'success') rawBalance = balanceResult.result as bigint;
                    balanceStr = rawBalance
                        ? formatDisplayBalanceForSelectable(rawBalance, baseToken.decimals, baseToken.symbol)
                        : undefined;
                }

                const pricePerToken = baseToken.symbol ? tokenPrices[baseToken.symbol] : undefined;
                let totalUsdValueStr: string | undefined;
                if (rawBalance !== undefined && pricePerToken !== undefined) {
                    const numericBalance = parseFloat(viemFormatUnits(rawBalance, baseToken.decimals));
                    totalUsdValueStr = `$${(numericBalance * pricePerToken).toFixed(2)}`;
                }

                return {
                    ...baseToken,
                    balance: balanceStr,
                    usdValue: totalUsdValueStr,
                    rawBalance,
                    pricePerTokenUSD: pricePerToken,
                };
            })
            .sort((a, b) => {
                const valA =
                    a.rawBalance && a.pricePerTokenUSD
                        ? parseFloat(viemFormatUnits(a.rawBalance, a.decimals)) * a.pricePerTokenUSD
                        : 0;
                const valB =
                    b.rawBalance && b.pricePerTokenUSD
                        ? parseFloat(viemFormatUnits(b.rawBalance, b.decimals)) * b.pricePerTokenUSD
                        : 0;
                if (valB !== valA) return valB - valA;
                return (b.rawBalance || 0n) > (a.rawBalance || 0n) ? 1 : -1;
            });
    }, [
        baseSelectableTokensForList,
        erc20BalancesData,
        nativeTokenBalanceDataForList,
        tokenPrices,
        selectableTokensContracts,
    ]);

    const clearCalculatedDetails = useCallback(() => {
        setCustomError(null);
        setSwapError(null);
        setTradeDetails(null);
        setPriceImpact(null);
        setNetworkFee(null);
        setSlippage(null);
        setMinimumReceivedDisplay(null);
        setExecutionPriceDisplay(null);
        setTxBlockHash(null);
        setTransactionId(null);
        setPaidTransactionFee(null);
        setReviewSwap(false);
        setSwapSuccess(false);
        setIsProcessingApproval(false);
        setIsProcessingSwap(false);
        shouldCalculate.current = true;
    }, []);

    useEffect(() => {
        if (!processingOpen) {
            clearCalculatedDetails();
        }
    }, [clearCalculatedDetails, processingOpen, swapSuccess, currentChainId]);

    const shouldCalculate = useRef(true);
    const calcRef = useRef<NodeJS.Timeout | null>(null);

    const calcAmounts = useCallback(
        async (signal: AbortSignal) => {
            let amountTypedByUserStr: string;
            let tokenUsedForParsingAmount: Token | NativeCurrency | undefined;
            let amountTypeForGetTradeDetails: SwapField;

            const tradeInputTokenDef = direction === 'toXtm' ? fromUiTokenDefinition : toUiTokenDefinition;
            const tradeOutputTokenDef = direction === 'toXtm' ? toUiTokenDefinition : fromUiTokenDefinition;

            if (lastUpdatedField === 'ethTokenField') {
                amountTypedByUserStr = ethTokenAmount;
                tokenUsedForParsingAmount = fromUiTokenDefinition;
                amountTypeForGetTradeDetails = 'ethTokenField';
            } else {
                amountTypedByUserStr = wxtmAmount;
                tokenUsedForParsingAmount = toUiTokenDefinition;
                amountTypeForGetTradeDetails = 'wxtmField';
            }

            if (
                !tokenUsedForParsingAmount ||
                !amountTypedByUserStr ||
                Number.isNaN(Number(amountTypedByUserStr)) ||
                Number(amountTypedByUserStr) <= 0 ||
                !tradeInputTokenDef ||
                !tradeOutputTokenDef
            ) {
                clearCalculatedDetails();
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const amountForCalcWei = viemParseUnits(amountTypedByUserStr, tokenUsedForParsingAmount.decimals);
                const details = await getTradeDetails(
                    amountForCalcWei.toString(),
                    amountTypeForGetTradeDetails,
                    undefined,
                    signal
                );
                if (signal.aborted) return;

                setTradeDetails(details);

                if (details && details.inputAmount && details.outputAmount) {
                    // Ensure details are valid
                    setPriceImpact(
                        details.priceImpactPercent ? `${details.priceImpactPercent.toSignificant(2)}%` : null
                    );
                    setSlippage(
                        details.priceImpactPercent
                            ? `${details.priceImpactPercent.toSignificant(2)}% (Price Impact)`
                            : null
                    );
                    setNetworkFee(details.estimatedGasFeeNative || null);

                    if (details.minimumReceived && details.minimumReceived.currency.symbol) {
                        setMinimumReceivedDisplay(
                            `${formatAmountSmartly(details.minimumReceived)} ${details.minimumReceived.currency.symbol}`
                        );
                    } else setMinimumReceivedDisplay(null);

                    if (details.executionPrice) {
                        const baseToken = details.executionPrice.baseCurrency;
                        const quoteToken = details.executionPrice.quoteCurrency;
                        if (baseToken.symbol && quoteToken.symbol) {
                            setExecutionPriceDisplay(
                                `1 ${baseToken.symbol} = ${details.executionPrice.toSignificant(6)} ${quoteToken.symbol}`
                            );
                        } else setExecutionPriceDisplay(null);
                    } else setExecutionPriceDisplay(null);

                    if (lastUpdatedField === 'ethTokenField') {
                        setWxtmAmount(formatAmountSmartly(details.outputAmount));
                    } else {
                        setEthTokenAmount(formatAmountSmartly(details.inputAmount));
                    }
                } else {
                    if (lastUpdatedField === 'ethTokenField' && wxtmAmount !== '') setWxtmAmount('');
                    else if (lastUpdatedField === 'wxtmField' && ethTokenAmount !== '') setEthTokenAmount('');
                    clearCalculatedDetails(); // Clear if details are null or incomplete
                }
                setIsLoading(false);
            } catch (e: any) {
                addToast({ title: 'Calculation Error', text: e.message || 'Failed to get quote.', type: 'error' });
                clearCalculatedDetails();
                setIsLoading(false);
            }
        },
        [
            lastUpdatedField,
            direction,
            ethTokenAmount,
            fromUiTokenDefinition,
            wxtmAmount,
            toUiTokenDefinition,
            clearCalculatedDetails,
            getTradeDetails,
            addToast,
        ]
    );

    const debounceCalc = useCallback(() => {
        if (calcRef.current) clearTimeout(calcRef.current);
        if (abortController.current) abortController.current.abort();
        abortController.current = new AbortController();
        const signal = abortController.current.signal;

        if (!shouldCalculate.current) return;
        calcRef.current = setTimeout(() => {
            if (shouldCalculate.current) {
                shouldCalculate.current = false;
                calcAmounts(signal);
            } else setIsLoading(false);
        }, 500);
    }, [calcAmounts]);

    useEffect(() => {
        if (shouldCalculate.current) debounceCalc();
        return () => {
            if (calcRef.current) clearTimeout(calcRef.current);
        };
    }, [ethTokenAmount, wxtmAmount, lastUpdatedField, direction, debounceCalc]);

    const handleNumberInput = (value: string, field: SwapField) => {
        clearCalculatedDetails();
        const currentUiTokenDef = field === 'ethTokenField' ? fromUiTokenDefinition : toUiTokenDefinition;
        const maxDecimals = currentUiTokenDef?.decimals ?? 18;
        let processedValue = value;

        if (processedValue === '' || processedValue === '.' || processedValue === '0') {
            if (field === 'ethTokenField') {
                setEthTokenAmount(processedValue);
                if (wxtmAmount !== '') setWxtmAmount('');
            } else {
                setWxtmAmount(processedValue);
                if (ethTokenAmount !== '') setEthTokenAmount('');
            }
            setLastUpdatedField(field);
            shouldCalculate.current = false;
            clearCalculatedDetails();
            setIsLoading(false);
            if (calcRef.current) clearTimeout(calcRef.current);
            return;
        }
        const regex = /^\d*\.?\d*$/;
        if (!regex.test(processedValue) || (processedValue !== '.' && Number.isNaN(Number(processedValue)))) return;
        if (processedValue.length > 1 && processedValue.startsWith('0') && !processedValue.startsWith('0.')) {
            processedValue = processedValue.substring(1);
        }
        const parts = processedValue.split('.');
        if (parts[1] && parts[1].length > maxDecimals) {
            processedValue = `${parts[0]}.${parts[1].substring(0, maxDecimals)}`;
        }

        if (field === 'ethTokenField') setEthTokenAmount(processedValue);
        else setWxtmAmount(processedValue);
        setLastUpdatedField(field);
        shouldCalculate.current = true;
        setIsLoading(true);
    };

    const handleToggleUiDirection = useCallback(() => {
        const newUiDirection = direction === 'toXtm' ? 'fromXtm' : 'toXtm';
        setSwapEngineDirection(newUiDirection);
        const tempAmount = ethTokenAmount;
        setEthTokenAmount(wxtmAmount);
        setWxtmAmount(tempAmount);
        setLastUpdatedField(lastUpdatedField === 'ethTokenField' ? 'wxtmField' : 'ethTokenField');
        clearCalculatedDetails();
        shouldCalculate.current = true;
    }, [direction, setSwapEngineDirection, clearCalculatedDetails, ethTokenAmount, wxtmAmount, lastUpdatedField]);

    const handleConfirm = async () => {
        setTransactionId(null);
        setSwapSuccess(false);
        setPaidTransactionFee(null);
        setTxBlockHash(null);

        if (!tradeDetails || !tradeDetails.inputAmount || !tradeDetails.outputAmount || !tradeDetails.inputToken) {
            addToast({ title: 'Error', text: 'No valid trade details. Please try again.', type: 'error' });
            return;
        }

        const inputAmountToExecute = BigInt(tradeDetails.inputAmount.quotient.toString());
        if (!inputAmountToExecute || inputAmountToExecute <= 0n) {
            addToast({ title: 'Error', text: 'Invalid trade amount.', type: 'error' });
            return;
        }

        setProcessingOpen(true);
        setReviewSwap(false);
        setIsProcessingApproval(true); // Indicates "preparing transaction" (includes permit signing if applicable)

        try {
            const swapResult = await executeSwap(tradeDetails);

            setIsProcessingApproval(false); // Done with pre-swap steps
            setIsProcessingSwap(true); // Indicates swap tx is submitted

            if (!swapResult || !swapResult.receipt || swapResult.receipt.status !== 1) {
                setIsProcessingSwap(false);
                setProcessingOpen(false);
                addToast({
                    title: 'Swap Failed',
                    text: swapResult?.response?.hash
                        ? `Transaction ${swapResult.response.hash} failed.`
                        : 'Transaction failed on-chain.',
                    type: 'error',
                });
                return;
            }

            setIsProcessingSwap(false);
            setSwapSuccess(true);
            setTransactionId(swapResult.response.hash);
            setTxBlockHash(swapResult.receipt.blockHash as `0x${string}`);

            if (swapResult.receipt.gasUsed && swapResult.receipt.gasPrice && connectedAccount.chain) {
                const swapFee =
                    BigInt(swapResult.receipt.gasUsed.toString()) * BigInt(swapResult.receipt.gasPrice.toString());
                setPaidTransactionFee(
                    `${utilFormatNativeGasFee(swapFee, connectedAccount.chain.nativeCurrency.decimals, connectedAccount.chain.nativeCurrency.symbol)}`
                );
            }

            setTimeout(() => {
                handleRefetchBalances();
            }, 3000);
        } catch (e: any) {
            setIsProcessingApproval(false);
            setIsProcessingSwap(false);
            setProcessingOpen(false);
            addToast({
                title: 'Transaction Error',
                text: e.message || 'An error occurred during the swap.',
                type: 'error',
            });
        }
    };

    const transactionForDisplay: SwapTransaction = useMemo(
        () => ({
            amount: direction === 'toXtm' ? ethTokenAmount : wxtmAmount,
            targetAmount: direction === 'toXtm' ? wxtmAmount : ethTokenAmount,
            direction: direction,
            slippage,
            networkFee,
            priceImpact,
            minimumReceived: minimumReceivedDisplay,
            executionPrice: executionPriceDisplay,
            transactionId,
            txBlockHash,
            paidTransactionFeeApproval: null, // Combined into paidTransactionFee
            paidTransactionFeeSwap: paidTransactionFee, // Use the combined fee
        }),
        [
            direction,
            ethTokenAmount,
            wxtmAmount,
            slippage,
            networkFee,
            priceImpact,
            minimumReceivedDisplay,
            executionPriceDisplay,
            transactionId,
            txBlockHash,
            paidTransactionFee,
        ]
    );

    const handleSelectFromToken = useCallback(
        (selectedToken: SelectableTokenInfo) => {
            setPairTokenAddress(selectedToken.address);
            setEthTokenAmount('1'); // Reset amount on token change
            setWxtmAmount('');
            setLastUpdatedField('ethTokenField');
            setTokenSelectOpen(false);
            clearCalculatedDetails();
            shouldCalculate.current = true;
        },
        [setPairTokenAddress, clearCalculatedDetails]
    );

    const anyLoading = useMemo(
        () =>
            isLoading ||
            isLoadingFromBalance ||
            isLoadingToBalance ||
            isLoadingErc20Balances ||
            isLoadingNativeForList ||
            isLoadingPrices ||
            isSwapEngineLoading ||
            isSwapEngineApproving,
        [
            isLoading,
            isLoadingFromBalance,
            isLoadingToBalance,
            isLoadingErc20Balances,
            isLoadingNativeForList,
            isLoadingPrices,
            isSwapEngineLoading,
            isSwapEngineApproving,
        ]
    );

    return {
        notEnoughBalance,
        fromTokenDisplay,
        toTokenDisplay,
        reviewSwap,
        setReviewSwap,
        isLoading: anyLoading,
        processingOpen,
        setProcessingOpen,
        isProcessingApproval,
        isProcessingSwap,
        swapSuccess,
        ethTokenAmount,
        wxtmAmount,
        uiDirection: direction,
        handleConfirm,
        transaction: transactionForDisplay,
        useSwapError,
        handleSelectFromToken,
        selectableFromTokens,
        tokenSelectOpen,
        setTokenSelectOpen,
        handleToggleUiDirection,
        clearCalculatedDetails,
        insufficientLiquidity,
        handleRefetchBalances,
        lastUpdatedField,
        error: swapError || useSwapError, // Combine errors
        customError,
        setCustomError,
        setFromAmount: (val: string) => handleNumberInput(val, 'ethTokenField'),
        setTargetAmount: (val: string) => handleNumberInput(val, 'wxtmField'),
    };
};
