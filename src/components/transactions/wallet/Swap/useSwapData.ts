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
import { useUniswapV3Interactions } from '@app/hooks/swap/useSwapV3'; // Correct path

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

    const lastEthValue = useRef<string>('1');
    const lastWxtmValue = useRef<string>('');
    const [ethTokenAmount, setEthTokenAmount] = useState<string>(lastEthValue.current);
    const [wxtmAmount, setWxtmAmount] = useState<string>(lastWxtmValue.current);

    const [lastUpdatedField, setLastUpdatedField] = useState<SwapField>('ethTokenField');

    const [reviewSwap, setReviewSwap] = useState(false);
    // isLoading in useSwapData will combine local loading with hook's loading
    const [isCalculatingQuote, setIsCalculatingQuote] = useState(false);
    const [processingOpen, setProcessingOpen] = useState(false);
    const [isProcessingPreSwap, setIsProcessingPreSwap] = useState(false); // For permit signing
    const [isProcessingSwapTx, setIsProcessingSwapTx] = useState(false); // For actual swap tx
    const [swapSuccess, setSwapSuccess] = useState(false);
    const [tokenSelectOpen, setTokenSelectOpen] = useState(false);

    const [priceImpact, setPriceImpact] = useState<string | null>(null);
    const [networkFee, setNetworkFee] = useState<string | null>(null);
    const [slippage, setSlippage] = useState<string | null>(null);
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [paidTransactionFee, setPaidTransactionFee] = useState<string | null>(null);
    const [txBlockHash, setTxBlockHash] = useState<`0x${string}` | null>(null);
    const [uiError, setUiError] = useState<string | null>(null); // Error specific to this UI layer
    const [minimumReceivedDisplay, setMinimumReceivedDisplay] = useState<string | null>(null);
    const [executionPriceDisplay, setExecutionPriceDisplay] = useState<string | null>(null);

    const [tradeDetails, setTradeDetails] = useState<V3TradeDetails | null>(null);
    const defaultChainId = useConfigCoreStore((s) => s.default_chain);

    const abortController = useRef<AbortController | null>(null);

    const {
        direction,
        addLiquidityV3,
        token0: swapEngineInputToken,
        token1: swapEngineOutputToken,
        setDirection: setSwapEngineDirection,
        setPairTokenAddress,
        getTradeDetails,
        executeSwap,
        insufficientLiquidity: insufficientLiquidityFromHook,
        error: swapEngineError,
        isLoading: isSwapEngineLoading,
        isApproving: isSwapEngineSigningPermit, // This is the isApproving from the inner hook
    } = useUniswapV3Interactions();

    const currentChainId = useMemo(
        () => connectedAccount.chain?.id || defaultChainId,
        [connectedAccount.chain, defaultChainId]
    );

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
        uiTokenDefinition: fromUiTokenDefinition,
        chainId: currentChainId,
        accountAddress: connectedAccount.address,
        fallbackDefinition: currentChainId ? Ether.onChain(currentChainId) : undefined,
    });

    const {
        tokenDisplayInfo: toTokenDisplay,
        isLoading: isLoadingToBalance,
        refetch: refetchToToken,
    } = useTokenDisplayInfo({
        uiTokenDefinition: toUiTokenDefinition,
        chainId: currentChainId,
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
        const chainId = currentChainId;
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
            if (tokenKey === EnabledTokensEnum.WXTM && xtmDef) tokenDefinitionFromEnum = xtmDef;

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
    }, [currentChainId]);

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
                    newPrices[token.symbol] = await fetchTokenPriceUSD(token.symbol, currentChainId);
                }
            });
            await Promise.all(promises);
            setTokenPrices((prev) => ({ ...prev, ...newPrices }));
            setIsLoadingPrices(false);
        };
        fetchAllPrices();
    }, [baseSelectableTokensForList, currentChainId]);

    useEffect(() => {
        lastEthValue.current = ethTokenAmount;
        lastWxtmValue.current = wxtmAmount;
    }, [ethTokenAmount, wxtmAmount]);

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
        setUiError(null);
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
        setIsProcessingPreSwap(false);
        setIsProcessingSwapTx(false);
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

            const tradeInputTokenDef = direction === 'toXtm' ? fromUiTokenDefinition : toUiTokenDefinition;
            const tradeOutputTokenDef = direction === 'toXtm' ? toUiTokenDefinition : fromUiTokenDefinition;

            if (lastUpdatedField === 'ethTokenField') {
                amountTypedByUserStr = ethTokenAmount;
                tokenUsedForParsingAmount = fromUiTokenDefinition;
            } else {
                amountTypedByUserStr = wxtmAmount;
                tokenUsedForParsingAmount = toUiTokenDefinition;
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
                setIsCalculatingQuote(false);
                return;
            }

            setIsCalculatingQuote(true);
            try {
                const amountForCalcWei = viemParseUnits(amountTypedByUserStr, tokenUsedForParsingAmount.decimals);
                const details = await getTradeDetails(amountForCalcWei.toString(), lastUpdatedField, signal);
                if (signal.aborted) {
                    setIsCalculatingQuote(false);
                    return;
                }

                setTradeDetails(details);

                if (details && details.inputAmount && details.outputAmount) {
                    setPriceImpact(details.priceImpactPercent ? `${details.priceImpactPercent}%` : null);
                    setSlippage(details.priceImpactPercent ? `${details.priceImpactPercent}% (Price Impact)` : null);
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

                    if (details.inputToken?.name === XTM_SDK_TOKEN[currentChainId].name) {
                        if (lastUpdatedField === 'ethTokenField') {
                            setWxtmAmount(formatAmountSmartly(details.inputAmount));
                        } else {
                            setEthTokenAmount(formatAmountSmartly(details.outputAmount));
                        }
                    } else {
                        if (lastUpdatedField === 'ethTokenField') {
                            setWxtmAmount(formatAmountSmartly(details.outputAmount));
                        } else {
                            setEthTokenAmount(formatAmountSmartly(details.inputAmount));
                        }
                    }
                } else {
                    if (lastUpdatedField === 'ethTokenField' && wxtmAmount !== '') setWxtmAmount('');
                    else if (lastUpdatedField === 'wxtmField' && ethTokenAmount !== '') setEthTokenAmount('');
                    clearCalculatedDetails();
                }
                setIsCalculatingQuote(false);
            } catch (e: any) {
                addToast({ title: 'Calculation Error', text: e.message || 'Failed to get quote.', type: 'error' });
                clearCalculatedDetails();
                setIsCalculatingQuote(false);
            }
        },
        [
            direction,
            fromUiTokenDefinition,
            toUiTokenDefinition,
            lastUpdatedField,
            ethTokenAmount,
            wxtmAmount,
            clearCalculatedDetails,
            getTradeDetails,
            currentChainId,
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
            } else setIsCalculatingQuote(false);
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
            setIsCalculatingQuote(false);
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
        setIsCalculatingQuote(true);
    };

    const handleToggleUiDirection = useCallback(() => {
        const newUiDirection = direction === 'toXtm' ? 'fromXtm' : 'toXtm';
        setSwapEngineDirection(newUiDirection);
        clearCalculatedDetails();
        shouldCalculate.current = true;
    }, [direction, setSwapEngineDirection, clearCalculatedDetails]);

    const handleConfirm = async () => {
        setTransactionId(null);
        setSwapSuccess(false);
        setPaidTransactionFee(null);
        setTxBlockHash(null);
        setUiError(null);

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
        setIsProcessingPreSwap(true);

        try {
            const swapResult = await executeSwap(tradeDetails);

            setIsProcessingPreSwap(false);

            if (!swapResult || !swapResult.receipt) {
                // Check if executeSwap returned null or no receipt
                setIsProcessingSwapTx(false);
                setProcessingOpen(false);
                // Error would have been set by executeSwap, or set a generic one here
                setUiError(swapEngineError || 'Swap execution failed to return a result.');
                addToast({
                    title: 'Swap Failed',
                    text: swapEngineError || 'Swap execution did not complete.',
                    type: 'error',
                });
                return;
            }

            setIsProcessingSwapTx(true); // Indicates swap tx is submitted and we are waiting for it

            if (swapResult.receipt.status !== 1) {
                setIsProcessingSwapTx(false);
                setProcessingOpen(false);
                setUiError(`Transaction ${swapResult.response.hash} failed on-chain.`);
                addToast({
                    title: 'Swap Failed',
                    text: `Transaction ${swapResult.response.hash} failed.`,
                    type: 'error',
                });
                return;
            }

            setIsProcessingSwapTx(false);
            setSwapSuccess(true);
            setTransactionId(swapResult.response.hash);
            setTxBlockHash(swapResult.receipt.blockHash as `0x${string}`);

            if (swapResult.receipt.gasUsed && swapResult.receipt.gasPrice && connectedAccount.chain) {
                // Use effectiveGasPrice
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
            // This catch is for errors thrown by executeSwap itself before returning
            setIsProcessingPreSwap(false);
            setIsProcessingSwapTx(false);
            setProcessingOpen(false);
            setUiError(e.message || 'An error occurred during the swap process.');
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
            paidTransactionFeeApproval: null,
            paidTransactionFeeSwap: paidTransactionFee,
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
            setEthTokenAmount('1');
            setWxtmAmount('');
            setLastUpdatedField('ethTokenField');
            setTokenSelectOpen(false);
            clearCalculatedDetails();
            shouldCalculate.current = true;
        },
        [setPairTokenAddress, clearCalculatedDetails]
    );

    const combinedIsLoading = useMemo(
        () =>
            isCalculatingQuote ||
            isLoadingFromBalance ||
            isLoadingToBalance ||
            isLoadingErc20Balances ||
            isLoadingNativeForList ||
            isLoadingPrices ||
            isSwapEngineLoading,
        [
            isCalculatingQuote,
            isLoadingFromBalance,
            isLoadingToBalance,
            isLoadingErc20Balances,
            isLoadingNativeForList,
            isLoadingPrices,
            isSwapEngineLoading,
        ]
    );

    const combinedError = uiError || swapEngineError; // Prioritize UI error, then hook error

    return {
        notEnoughBalance,
        fromTokenDisplay,
        toTokenDisplay,
        reviewSwap,
        setReviewSwap,
        isLoading: combinedIsLoading,
        processingOpen,
        setProcessingOpen,
        isProcessingApproval: isProcessingPreSwap || isSwapEngineSigningPermit, // Combine pre-swap and permit signing
        isProcessingSwap: isProcessingSwapTx,
        swapSuccess,
        ethTokenAmount,
        wxtmAmount,
        uiDirection: direction,
        handleConfirm,
        transaction: transactionForDisplay,
        error: combinedError, // Use combined error
        handleSelectFromToken,
        selectableFromTokens,
        tokenSelectOpen,
        setTokenSelectOpen,
        handleToggleUiDirection,
        clearCalculatedDetails,
        insufficientLiquidity: insufficientLiquidityFromHook,
        handleRefetchBalances,
        lastUpdatedField,
        addLiquidityV3,
        setFromAmount: (val: string) => handleNumberInput(val, 'ethTokenField'),
        setTargetAmount: (val: string) => handleNumberInput(val, 'wxtmField'),
    };
};
