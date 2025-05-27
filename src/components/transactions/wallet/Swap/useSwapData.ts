import { useAccount, useBalance, useReadContracts } from 'wagmi';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToastStore } from '@app/components/ToastStack/useToastStore';
import { formatUnits as viemFormatUnits, parseUnits as viemParseUnits, erc20Abi as viemErc20Abi } from 'viem';
import { Token, NativeCurrency, WETH9, Ether } from '@uniswap/sdk-core';
import {
    ENABLED_TOKEN_ADDRESSES,
    EnabledTokensEnum,
    TOKEN_DEFINITIONS,
    XTM_SDK_TOKEN,
} from '@app/hooks/swap/lib/constants';
import { SwapField, SwapTransaction, TradeDetails } from '@app/hooks/swap/lib/types';
import { useUniswapV2Interactions } from '@app/hooks/swap/useSwapV2';
import { useConfigCoreStore } from '@app/store';
import {
    fetchTokenPriceUSD,
    formatAmountSmartly,
    formatDisplayBalanceForSelectable,
    formatNativeGasFee as utilFormatNativeGasFee,
} from '@app/hooks/swap/lib/utils';
import { useTokenDisplayInfo } from './helpers/useTokenInfo';
import { TransactionReceipt as EthersTransactionReceipt } from 'ethers';

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
    const [isProcessingApproval, setIsProcessingApproval] = useState(false);
    const [isProcessingSwap, setIsProcessingSwap] = useState(false);
    const [swapSuccess, setSwapSuccess] = useState(false);
    const [tokenSelectOpen, setTokenSelectOpen] = useState(false);

    const [priceImpact, setPriceImpact] = useState<string | null>(null);
    const [networkFee, setNetworkFee] = useState<string | null>(null);
    const [slippage, setSlippage] = useState<string | null>(null); // This seems to be set to priceImpact, consider if it should be different
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [paidTransactionFeeApproval, setPaidTransactionFeeApproval] = useState<string | null>(null);
    const [paidTransactionFeeSwap, setPaidTransactionFeeSwap] = useState<string | null>(null);
    const [txBlockHash, setTxBlockHash] = useState<`0x${string}` | null>(null);
    const [swapError, setSwapError] = useState<string | null>(null);
    const [minimumReceivedDisplay, setMinimumReceivedDisplay] = useState<string | null>(null);
    const [executionPriceDisplay, setExecutionPriceDisplay] = useState<string | null>(null);
    const calcAmountsAbortControllerRef = useRef<AbortController | null>(null);

    const [tradeDetails, setTradeDetails] = useState<TradeDetails | null>(null);
    const defaultChainId = useConfigCoreStore((s) => s.default_chain);

    const {
        direction,
        token0: swapEngineInputToken,
        token1: swapEngineOutputToken,
        sdkToken0,
        sdkToken1,
        setDirection: setSwapEngineDirection,
        setPairTokenAddress,
        getTradeDetails,
        checkAndRequestApproval,
        executeSwap,
        insufficientLiquidity,
        error: useSwapError,
    } = useUniswapV2Interactions();

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
        uiTokenDefinition: fromUiTokenDefinition as Token,
        chainId: currentChainId || defaultChainId,
        accountAddress: connectedAccount.address,
        fallbackDefinition: currentChainId ? WETH9[currentChainId] : undefined,
    });

    const {
        tokenDisplayInfo: toTokenDisplay,
        isLoading: isLoadingToBalance,
        refetch: refetchToToken,
    } = useTokenDisplayInfo({
        uiTokenDefinition: toUiTokenDefinition as Token,
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

        Array.from(Object.keys(ENABLED_TOKEN_ADDRESSES)).forEach((tokenId) => {
            const token = TOKEN_DEFINITIONS[tokenId][chainId];
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
            let tokenDefinitionFromEnum: typeof xtmDef;

            switch (tokenKey) {
                case EnabledTokensEnum.WETH:
                    tokenDefinitionFromEnum = WETH9[chainId];
                    break;
                case EnabledTokensEnum.WXTM:
                    tokenDefinitionFromEnum = xtmDef;
                    break;
                default:
                    tokenDefinitionFromEnum = undefined;
            }

            if (tokenDefinitionFromEnum?.address) {
                if (!tokens.find((t) => t.definition.equals(tokenDefinitionFromEnum))) {
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
                newPrices[token.symbol] = await fetchTokenPriceUSD(token.symbol, currentChainId);
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
                    if (balanceResult?.status === 'success') {
                        rawBalance = balanceResult.result as bigint;
                    }
                    balanceStr = rawBalance
                        ? formatDisplayBalanceForSelectable(rawBalance, baseToken.decimals, baseToken.symbol)
                        : undefined;
                }

                const pricePerToken = tokenPrices[baseToken.symbol];
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
        setSwapError(null);
        setTradeDetails(null);
        setPriceImpact(null);
        setNetworkFee(null);
        setSlippage(null);
        setMinimumReceivedDisplay(null);
        setExecutionPriceDisplay(null);
        setTxBlockHash(null);
        setTransactionId(null);
        setPaidTransactionFeeApproval(null);
        setPaidTransactionFeeSwap(null);
        setPaidTransactionFeeApproval(null);
        setPaidTransactionFeeSwap(null);

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

    const calcAmounts = useCallback(async () => {
        if (!shouldCalculate.current) return;
        if (calcAmountsAbortControllerRef.current) {
            calcAmountsAbortControllerRef.current.abort();
            console.info('Previous request for calcAmounts aborted.');
        }
        calcAmountsAbortControllerRef.current = new AbortController();
        const signal = calcAmountsAbortControllerRef.current.signal;

        shouldCalculate.current = false;
        let amountTypedByUserStr: string;
        let tokenUsedForParsingAmount: Token | NativeCurrency | undefined;
        let amountTypeForGetTradeDetails: SwapField = 'wxtmField';

        const tradeInputTokenSDK = sdkToken0;
        const tradeOutputTokenSDK = sdkToken1;

        if (lastUpdatedField === 'ethTokenField') {
            amountTypedByUserStr = ethTokenAmount;
            tokenUsedForParsingAmount = fromUiTokenDefinition;
        } else {
            amountTypedByUserStr = wxtmAmount;
            tokenUsedForParsingAmount = toUiTokenDefinition;
        }

        if (direction === 'toXtm') {
            amountTypeForGetTradeDetails = lastUpdatedField === 'ethTokenField' ? 'ethTokenField' : 'wxtmField';
        } else {
            amountTypeForGetTradeDetails = lastUpdatedField === 'ethTokenField' ? 'wxtmField' : 'ethTokenField';
        }

        if (
            !tokenUsedForParsingAmount ||
            !amountTypedByUserStr ||
            Number.isNaN(Number(amountTypedByUserStr)) ||
            Number(amountTypedByUserStr) <= 0 ||
            !tradeInputTokenSDK ||
            !tradeOutputTokenSDK
        ) {
            clearCalculatedDetails();
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const amountForCalcWei = viemParseUnits(amountTypedByUserStr, tokenUsedForParsingAmount.decimals);
            const details = await getTradeDetails(amountForCalcWei.toString(), amountTypeForGetTradeDetails);
            if (signal?.aborted) return;

            setTradeDetails(details);

            if (details.trade) {
                setPriceImpact(details.priceImpactPercent ? `${details.priceImpactPercent}%` : null);
                setSlippage(details.priceImpactPercent ? `${details.priceImpactPercent}% (Price Impact)` : null); // Consider actual slippage setting
                setNetworkFee(details.estimatedGasFeeNative || null);

                if (details.minimumReceived && details.minimumReceived.currency.symbol) {
                    setMinimumReceivedDisplay(
                        `${formatAmountSmartly(details.minimumReceived)} ${details.minimumReceived.currency.symbol}`
                    );
                } else {
                    setMinimumReceivedDisplay(null);
                }

                if (details.executionPrice) {
                    const baseToken = details.executionPrice.baseCurrency;
                    const quoteToken = details.executionPrice.quoteCurrency;
                    if (baseToken.symbol && quoteToken.symbol) {
                        setExecutionPriceDisplay(
                            `1 ${baseToken.symbol} = ${details.executionPrice.toSignificant(6)} ${quoteToken.symbol}`
                        );
                    } else {
                        setExecutionPriceDisplay(null);
                    }
                } else {
                    setExecutionPriceDisplay(null);
                }

                if (lastUpdatedField === 'ethTokenField') {
                    if (direction === 'toXtm') {
                        if (details.outputAmount) {
                            setWxtmAmount(formatAmountSmartly(details.outputAmount));
                        } else if (wxtmAmount !== '') {
                            setWxtmAmount('');
                        }
                    } else {
                        if (details.inputAmount) {
                            setWxtmAmount(formatAmountSmartly(details.inputAmount));
                        } else if (wxtmAmount !== '') {
                            setWxtmAmount('');
                        }
                    }
                } else {
                    // lastUpdatedField === 'wxtmField'
                    if (direction === 'toXtm') {
                        if (details.inputAmount) {
                            setEthTokenAmount(formatAmountSmartly(details.inputAmount));
                        } else if (ethTokenAmount !== '') {
                            setEthTokenAmount('');
                        }
                    } else {
                        if (details.outputAmount) {
                            setEthTokenAmount(formatAmountSmartly(details.outputAmount));
                        } else if (ethTokenAmount !== '') {
                            setEthTokenAmount('');
                        }
                    }
                }
            } else {
                clearCalculatedDetails();
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            addToast({ title: 'Calculation Error', text: e.message || 'Failed to get quote.', type: 'error' });
            clearCalculatedDetails();
        } finally {
            setIsLoading(false);
        }
    }, [
        sdkToken0,
        sdkToken1,
        lastUpdatedField,
        direction,
        ethTokenAmount,
        fromUiTokenDefinition,
        wxtmAmount,
        toUiTokenDefinition,
        clearCalculatedDetails,
        getTradeDetails,
        addToast,
    ]);

    const debounceCalc = useCallback(() => {
        if (calcRef.current) clearTimeout(calcRef.current);
        calcRef.current = setTimeout(() => {
            if (shouldCalculate.current) calcAmounts();
            else setIsLoading(false);
        }, 700);
    }, [calcAmounts]);

    useEffect(() => {
        if (shouldCalculate.current) debounceCalc();
        return () => {
            if (calcRef.current) clearTimeout(calcRef.current);
        };
    }, [ethTokenAmount, wxtmAmount, lastUpdatedField, direction, debounceCalc]);

    const handleNumberInput = (value: string, field: SwapField) => {
        setReviewSwap(false);
        setTransactionId(null);
        setSwapError(null);
        const currentUiTokenDef = field === 'ethTokenField' ? fromUiTokenDefinition : toUiTokenDefinition;
        const maxDecimals = currentUiTokenDef?.decimals ?? 18;
        let processedValue = value;

        if (processedValue === '' || processedValue === '.' || processedValue === '0') {
            if (field === 'ethTokenField') {
                setEthTokenAmount(processedValue);
                if (wxtmAmount !== '') setWxtmAmount('');
            } else {
                // field === 'target'
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
        if (processedValue.length > 1 && processedValue.startsWith('0') && !processedValue.startsWith('0.'))
            processedValue = processedValue.substring(1);
        const parts = processedValue.split('.');
        if (parts[1] && parts[1].length > maxDecimals)
            processedValue = `${parts[0]}.${parts[1].substring(0, maxDecimals)}`;

        if (field === 'ethTokenField') setEthTokenAmount(processedValue);
        else setWxtmAmount(processedValue);
        setLastUpdatedField(field);
        shouldCalculate.current = true;
        setIsLoading(true);
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
        setPaidTransactionFeeApproval(null);
        setPaidTransactionFeeSwap(null);
        setTxBlockHash(null);

        if (!tradeDetails?.trade || !sdkToken0) {
            addToast({ title: 'Error', text: 'No valid trade. Refresh quote.', type: 'error' });
            return;
        }
        const inputAmountToExecute = BigInt(tradeDetails.trade.inputAmount.quotient.toString());
        if (!inputAmountToExecute || inputAmountToExecute <= 0n) {
            addToast({ title: 'Error', text: 'Invalid trade amount.', type: 'error' });
            return;
        }
        const amountInWeiString = inputAmountToExecute.toString();

        setIsProcessingApproval(true);
        setProcessingOpen(true);
        setReviewSwap(false);

        let approvalTxFeeString = '';
        let swapTxFeeString = '';

        try {
            const approvalReceipt: EthersTransactionReceipt | null = (await checkAndRequestApproval(
                sdkToken0 as Token,
                amountInWeiString
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            )) as any;
            setIsProcessingApproval(false);

            if (approvalReceipt && approvalReceipt.gasUsed && approvalReceipt.gasPrice && connectedAccount.chain) {
                const approvalFee = approvalReceipt.gasUsed * approvalReceipt.gasPrice;
                approvalTxFeeString = `${utilFormatNativeGasFee(approvalFee, connectedAccount.chain.nativeCurrency.decimals, connectedAccount.chain.nativeCurrency.symbol)}`;
            }

            setIsProcessingSwap(true);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const swapResult = (await executeSwap(tradeDetails.trade!)) as any;
            setIsProcessingSwap(false);

            if (!swapResult || !swapResult.receipt || swapResult.receipt.status !== 1) {
                // Ethers uses 1 for success
                setProcessingOpen(false);
                addToast({ title: 'Swap Failed', text: 'Transaction failed.', type: 'error' });
                return;
            }

            setSwapSuccess(true);
            setTransactionId(swapResult.response.hash);
            setTxBlockHash(swapResult.receipt.blockHash as `0x${string}`);

            if (swapResult.receipt.gasUsed && swapResult.receipt.gasPrice && connectedAccount.chain) {
                const swapFee = swapResult.receipt.gasUsed * swapResult.receipt.gasPrice;
                swapTxFeeString = `${utilFormatNativeGasFee(BigInt(swapFee), connectedAccount.chain.nativeCurrency.decimals, connectedAccount.chain.nativeCurrency.symbol)}`;
            }

            setPaidTransactionFeeApproval(approvalTxFeeString);
            setPaidTransactionFeeSwap(swapTxFeeString);

            setTimeout(() => {
                handleRefetchBalances();
            }, 3000);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            setIsProcessingApproval(false);
            setIsProcessingSwap(false);
            setProcessingOpen(false);
            addToast({ title: 'Error', text: e.message || 'An error occurred.', type: 'error' });
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
            paidTransactionFeeApproval,
            paidTransactionFeeSwap,
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
            paidTransactionFeeApproval,
            paidTransactionFeeSwap,
        ]
    );

    const handleSelectFromToken = useCallback(
        (selectedToken: SelectableTokenInfo) => {
            setPairTokenAddress(selectedToken.address);
            setLastUpdatedField('ethTokenField');
            shouldCalculate.current = true;
            setTokenSelectOpen(false);
        },
        [setPairTokenAddress]
    );

    const finalIsLoading =
        isLoading ||
        isLoadingFromBalance ||
        isLoadingToBalance ||
        isLoadingErc20Balances ||
        isLoadingNativeForList ||
        isLoadingPrices;

    return {
        notEnoughBalance,
        fromTokenDisplay,
        toTokenDisplay,
        reviewSwap,
        setReviewSwap,
        isLoading: finalIsLoading,
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
        error: swapError,
        setFromAmount: (val: string) => handleNumberInput(val, 'ethTokenField'),
        setTargetAmount: (val: string) => handleNumberInput(val, 'wxtmField'),
    };
};
