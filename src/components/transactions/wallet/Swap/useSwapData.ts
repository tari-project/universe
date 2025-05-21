import { useAccount, useBalance, useReadContracts } from 'wagmi';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToastStore } from '@app/components/ToastStack/useToastStore';
import {
    formatUnits as viemFormatUnits,
    parseUnits as viemParseUnits,
    erc20Abi as viemErc20Abi,
    formatUnits,
} from 'viem';
import { Token, NativeCurrency, WETH9, Ether, ChainId } from '@uniswap/sdk-core';
import { DEFAULT_CHAIN_ID, EnabledTokensEnum, XTM_SDK_TOKEN } from '@app/hooks/swap/lib/constants';
import { SwapDirection, SwapField, TradeDetails } from '@app/hooks/swap/lib/types';
import { useUniswapV2Interactions } from '@app/hooks/swap/useSwapV2';

export type TokenSymbol = 'POL' | 'XTM' | 'WXTM' | 'DAI' | 'ETH';
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

const formatDisplayBalanceForSelectable = (
    rawBalance: bigint | undefined,
    decimals: number,
    symbol: string
): string => {
    if (rawBalance === undefined) return '0.000';
    return `${parseFloat(viemFormatUnits(rawBalance, decimals)).toFixed(Math.min(decimals, 5))} ${symbol}`;
};

// Placeholder for fetching USD prices - REPLACE THIS
const fetchTokenPriceUSD = async (_tokenSymbol: string, _chainId: ChainId | undefined): Promise<number | undefined> => {
    // MOCK IMPLEMENTATION - REPLACE WITH ACTUAL API/ORACLE CALL
    // console.warn(`MOCK: Fetching price for ${tokenSymbol} on chain ${chainId}`);
    // await new Promise((resolve) => setTimeout(resolve, 150)); // Simulate network delay
    // if (tokenSymbol === 'ETH' || tokenSymbol === 'WETH') return 3000.0;
    // if (tokenSymbol === 'wXTM') return 0.55;
    return undefined;
};

export const useSwapData = () => {
    const connectedAccount = useAccount();
    const addToast = useToastStore((s) => s.addToast);

    const [ethTokenAmount, setEthTokenAmount] = useState<string>('1');
    const [wxtmAmount, setWxtmAmount] = useState<string>('');
    const [lastUpdatedField, setLastUpdatedField] = useState<SwapField>('ethTokenField');
    const [uiDirection, setUiDirection] = useState<SwapDirection>('toXtm');

    const [reviewSwap, setReviewSwap] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [processingOpen, setProcessingOpen] = useState(false);
    const [isProcessingApproval, setIsProcessingApproval] = useState(false);
    const [isProcessingSwap, setIsProcessingSwap] = useState(false);
    const [swapSuccess, setSwapSuccess] = useState(false);
    const [tokenSelectOpen, setTokenSelectOpen] = useState(false);

    const [priceImpact, setPriceImpact] = useState<string | null>(null);
    const [networkFee, setNetworkFee] = useState<string | null>(null);
    const [slippage, setSlippage] = useState<string | null>(null);
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [paidTransactionFee, setPaidTransactionFee] = useState<string | null>(null);
    const [txBlockHash, setTxBlockHash] = useState<`0x${string}` | null>(null);
    const [swapError, setSwapError] = useState<string | null>(null);

    const [tradeDetails, setTradeDetails] = useState<TradeDetails | null>(null);

    const {
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
        () => (uiDirection === 'toXtm' ? swapEngineInputToken : swapEngineOutputToken),
        [uiDirection, swapEngineInputToken, swapEngineOutputToken]
    );
    const toUiTokenDefinition = useMemo(
        () => (uiDirection === 'toXtm' ? swapEngineOutputToken : swapEngineInputToken),
        [uiDirection, swapEngineInputToken, swapEngineOutputToken]
    );

    const { data: rawFromTokenBalanceData, isLoading: isLoadingFromBalance } = useBalance({
        address: connectedAccount.address,
        token: fromUiTokenDefinition?.isNative ? undefined : (fromUiTokenDefinition?.address as `0x${string}`),
        chainId: currentChainId,
    });

    const [fromTokenPrice, setFromTokenPrice] = useState<number | undefined>();
    useEffect(() => {
        if (fromUiTokenDefinition?.symbol && currentChainId) {
            fetchTokenPriceUSD(fromUiTokenDefinition.symbol, currentChainId).then(setFromTokenPrice);
        }
    }, [fromUiTokenDefinition, currentChainId]);

    const fromTokenDisplay = useMemo((): SelectableTokenInfo => {
        const def = fromUiTokenDefinition;
        const balData = rawFromTokenBalanceData;
        const decimals = def?.decimals || balData?.decimals || 18;
        const balance = formatDisplayBalanceForSelectable(
            balData?.value,
            decimals,
            def?.symbol || balData?.symbol || ''
        );
        let usdValStr: string | undefined;
        if (balData?.value !== undefined && fromTokenPrice !== undefined) {
            const numBal = parseFloat(viemFormatUnits(balData.value, decimals));
            usdValStr = `$${(numBal * fromTokenPrice).toFixed(2)}`;
        }
        return {
            label: def?.name || def?.symbol || 'Token',
            symbol: (def?.symbol || balData?.symbol || 'ETH').toUpperCase() as TokenSymbol,
            address: def?.isNative ? null : (def?.address as `0x${string}`) || null,
            iconSymbol: def?.symbol?.toLowerCase() || '',
            definition: def || Ether.onChain(currentChainId || ChainId.MAINNET),
            balance,
            rawBalance: balData?.value,
            decimals,
            pricePerTokenUSD: fromTokenPrice,
            usdValue: usdValStr,
        };
    }, [rawFromTokenBalanceData, fromUiTokenDefinition, currentChainId, fromTokenPrice]);

    const { data: rawToTokenBalanceData, isLoading: isLoadingToBalance } = useBalance({
        address: connectedAccount.address,
        token: toUiTokenDefinition?.isNative ? undefined : (toUiTokenDefinition?.address as `0x${string}`),
        chainId: currentChainId,
    });

    const [toTokenPrice, setToTokenPrice] = useState<number | undefined>();
    useEffect(() => {
        if (toUiTokenDefinition?.symbol && currentChainId) {
            fetchTokenPriceUSD(toUiTokenDefinition.symbol, currentChainId).then(setToTokenPrice);
        }
    }, [toUiTokenDefinition, currentChainId]);

    const toTokenDisplay = useMemo((): SelectableTokenInfo => {
        const def = toUiTokenDefinition;
        const balData = rawToTokenBalanceData;
        const decimals = def?.decimals || balData?.decimals || 18;
        const balance = formatDisplayBalanceForSelectable(
            balData?.value,
            decimals,
            def?.symbol || balData?.symbol || ''
        );
        let usdValStr: string | undefined;
        if (balData?.value !== undefined && toTokenPrice !== undefined) {
            const numBal = parseFloat(viemFormatUnits(balData.value, decimals));
            usdValStr = `$${(numBal * toTokenPrice).toFixed(2)}`;
        }
        return {
            label: def?.name || def?.symbol || 'Token',
            symbol: (def?.symbol || balData?.symbol || 'ETH').toUpperCase() as TokenSymbol,
            address: def?.isNative ? null : (def?.address as `0x${string}`) || null,
            iconSymbol: def?.symbol?.toLowerCase() || '',
            definition: def || XTM_SDK_TOKEN[currentChainId || ChainId.MAINNET]!,
            balance,
            rawBalance: balData?.value,
            decimals,
            pricePerTokenUSD: toTokenPrice,
            usdValue: usdValStr,
        };
    }, [rawToTokenBalanceData, toUiTokenDefinition, currentChainId, toTokenPrice]);

    const notEnoughBalance = useMemo(() => {
        if (!fromTokenDisplay.rawBalance || !ethTokenAmount || !fromTokenDisplay.decimals) return false;
        try {
            const amountBigInt = viemParseUnits(ethTokenAmount, fromTokenDisplay.decimals);
            return amountBigInt > fromTokenDisplay.rawBalance && uiDirection === 'toXtm';
        } catch {
            return true;
        }
    }, [fromTokenDisplay.rawBalance, fromTokenDisplay.decimals, ethTokenAmount, uiDirection]);

    const baseSelectableTokensForList = useMemo((): Omit<
        SelectableTokenInfo,
        'balance' | 'usdValue' | 'rawBalance' | 'pricePerTokenUSD'
    >[] => {
        const chainId = currentChainId || DEFAULT_CHAIN_ID;
        const xtmDef = XTM_SDK_TOKEN[chainId];
        const tokens: Omit<SelectableTokenInfo, 'balance' | 'usdValue' | 'rawBalance' | 'pricePerTokenUSD'>[] = [];

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
                        symbol: tokenDefinitionFromEnum.symbol || tokenKey,
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
        setTxBlockHash(null);
        setTransactionId(null);
        setPaidTransactionFee(null);
        setSwapSuccess(false);
        setIsProcessingApproval(false);
        setIsProcessingSwap(false);
        setEthTokenAmount('1');
        shouldCalculate.current = true;
    }, []);

    useEffect(() => {
        if (!processingOpen) {
            clearCalculatedDetails();
        }
    }, [clearCalculatedDetails, processingOpen, swapSuccess]);

    const shouldCalculate = useRef(true);
    const calcRef = useRef<NodeJS.Timeout | null>(null);

    const calcAmounts = useCallback(async () => {
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

        if (uiDirection === 'toXtm') {
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
            console.warn('Invalid values provided', {
                tokenUsedForParsingAmount,
                amountTypedByUserStr,
                tradeInputTokenSDK,
                tradeOutputTokenSDK,
                isNaN: Number.isNaN(Number(amountTypedByUserStr)),
            });
            clearCalculatedDetails();
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const amountForCalcWei = viemParseUnits(amountTypedByUserStr, tokenUsedForParsingAmount.decimals);
            const details = await getTradeDetails(amountForCalcWei.toString(), amountTypeForGetTradeDetails);
            setTradeDetails(details);

            if (details.trade) {
                setPriceImpact(details.trade.priceImpact.toSignificant(2) + '%');
                const networkFee = details.estimatedGasFeeNative || details.estimatedGasFeeUSD;
                if (networkFee) setNetworkFee(networkFee);
                setSlippage(details.trade.priceImpact.toSignificant(2) + '% (Price Impact)'); // Consider actual slippage setting

                if (shouldCalculate.current) {
                    if (lastUpdatedField === 'ethTokenField') {
                        if (uiDirection === 'toXtm') {
                            if (details.outputAmount) setWxtmAmount(details.outputAmount.toSignificant(6));
                            else if (wxtmAmount !== '') setWxtmAmount('');
                        } else {
                            if (details.inputAmount) setWxtmAmount(details.inputAmount.toSignificant(6));
                            else if (wxtmAmount !== '') setWxtmAmount('');
                        }
                    } else {
                        if (uiDirection === 'toXtm') {
                            if (details.inputAmount) setEthTokenAmount(details.inputAmount.toSignificant(6));
                            else if (ethTokenAmount !== '') setEthTokenAmount('');
                        } else {
                            if (details.outputAmount) setEthTokenAmount(details.outputAmount.toSignificant(6));
                            else if (ethTokenAmount !== '') setEthTokenAmount('');
                        }
                    }
                }
            } // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            setIsLoading(false);
            addToast({ title: 'Calculation Error', text: e.message || 'Failed to get quote.', type: 'error' });
        } finally {
            setIsLoading(false);
            shouldCalculate.current = false;
        }
    }, [
        sdkToken0,
        sdkToken1,
        lastUpdatedField,
        uiDirection,
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
    }, [ethTokenAmount, wxtmAmount, lastUpdatedField, uiDirection, debounceCalc]);

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
            setTradeDetails(null);
            setPriceImpact(null);
            setNetworkFee(null);
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
        const newUiDirection = uiDirection === 'toXtm' ? 'fromXtm' : 'toXtm';
        setUiDirection(newUiDirection);
        setSwapEngineDirection(newUiDirection);

        if (lastUpdatedField === 'ethTokenField' && ethTokenAmount && Number(ethTokenAmount) > 0) {
            shouldCalculate.current = true;
            setIsLoading(true);
        } else if (lastUpdatedField === 'wxtmField' && wxtmAmount && Number(wxtmAmount) > 0) {
            shouldCalculate.current = true;
            setIsLoading(true);
        } else if (ethTokenAmount && Number(ethTokenAmount) > 0) {
            setLastUpdatedField('ethTokenField');
            shouldCalculate.current = true;
            setIsLoading(true);
        } else if (wxtmAmount && Number(wxtmAmount) > 0) {
            // Fallback
            setLastUpdatedField('wxtmField');
            shouldCalculate.current = true;
            setIsLoading(true);
        } else {
            shouldCalculate.current = false;
            setTradeDetails(null);
            setPriceImpact(null);
            setNetworkFee(null);
            setSlippage(null);
            if (!(ethTokenAmount && Number(ethTokenAmount) > 0) && !(wxtmAmount && Number(wxtmAmount) > 0)) {
                setIsLoading(false);
            }
        }
    }, [uiDirection, setSwapEngineDirection, ethTokenAmount, wxtmAmount, lastUpdatedField]);

    const handleConfirm = () => {
        setTransactionId(null);
        setSwapSuccess(false);
        if (!tradeDetails?.trade) {
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
        const fromToken = uiDirection === 'toXtm' ? swapEngineInputToken : swapEngineOutputToken;
        checkAndRequestApproval(fromToken as Token, amountInWeiString)
            .then((approved) => {
                setIsProcessingApproval(false);
                if (!approved) {
                    setProcessingOpen(false);
                    addToast({ title: 'Approval Required', text: 'Approval failed.', type: 'warning' });
                    return;
                }
                setIsProcessingSwap(true);
                executeSwap(tradeDetails.trade!)
                    .then((result) => {
                        setIsProcessingSwap(false);
                        if (!result) {
                            setProcessingOpen(false);
                            addToast({ title: 'Swap Failed', text: 'Transaction failed.', type: 'error' });
                            return;
                        }
                        setSwapSuccess(true);
                        setTransactionId(result.hash);
                        setTxBlockHash(result.blockHash as `0x${string}`);
                        console.info('-------------------------Swap transaction:', result);
                        try {
                            const gasUsed = formatUnits(result.gasPrice, 18);
                            console.info(
                                '-------------------------Swap transaction gas used:',
                                result.gasPrice.toString()
                            );
                            setPaidTransactionFee(gasUsed);
                        } catch (e) {
                            console.error('Error calculating gas used:', e);
                        }
                    })
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .catch((e: any) => {
                        setIsProcessingSwap(false);
                        setProcessingOpen(false);
                        addToast({ title: 'Swap Error', text: e.message || 'Swap execution failed.', type: 'error' });
                    });
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .catch((e: any) => {
                setIsProcessingApproval(false);
                setProcessingOpen(false);
                addToast({ title: 'Approval Error', text: e.message || 'Approval process failed.', type: 'error' });
            });
    };

    const displayPrice = useMemo(() => {
        if (!tradeDetails?.midPrice) return null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let price: any;
        if (uiDirection === 'toXtm') {
            price = tradeDetails?.midPrice;
        } else {
            try {
                price = tradeDetails?.midPrice?.invert();
            } catch (e) {
                console.error('Error inverting price:', e);
                return null; // Cannot invert price
            }
        }

        const baseTokenSymbol = price?.baseToken?.symbol;
        const quoteTokenSymbol = price?.quoteToken?.symbol;
        const priceValue = price.toSignificant(6);

        return `1 ${baseTokenSymbol} = ${priceValue} ${quoteTokenSymbol}`;
    }, [tradeDetails?.midPrice, uiDirection]);

    const transactionForDisplay = useMemo(
        () => ({
            amount: uiDirection === 'toXtm' ? ethTokenAmount : wxtmAmount, // Amount user gives
            targetAmount: uiDirection === 'toXtm' ? wxtmAmount : ethTokenAmount, // Amount user gets
            direction: uiDirection,
            slippage,
            networkFee,
            priceImpact,
            transactionId,
            txBlockHash,
            paidTransactionFee,
        }),
        [
            uiDirection,
            ethTokenAmount,
            wxtmAmount,
            slippage,
            networkFee,
            priceImpact,
            transactionId,
            txBlockHash,
            paidTransactionFee,
        ]
    );

    const handleSelectFromToken = useCallback(
        (selectedToken: SelectableTokenInfo) => {
            setPairTokenAddress(selectedToken.address);
            setLastUpdatedField('ethTokenField');
            shouldCalculate.current = false;
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
        uiDirection,
        handleConfirm,
        transaction: transactionForDisplay,
        useSwapError,
        handleSelectFromToken,
        selectableFromTokens,
        tokenSelectOpen,
        setTokenSelectOpen,
        displayPrice,
        handleToggleUiDirection,
        clearCalculatedDetails,
        insufficientLiquidity,
        error: swapError,
        setFromAmount: (val: string) => handleNumberInput(val, 'ethTokenField'),
        setTargetAmount: (val: string) => handleNumberInput(val, 'wxtmField'),
    };
};
