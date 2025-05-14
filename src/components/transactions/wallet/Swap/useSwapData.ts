import { useAccount, useBalance, useReadContracts } from 'wagmi';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToastStore } from '@app/components/ToastStack/useToastStore';
import { formatUnits as viemFormatUnits, parseUnits as viemParseUnits, erc20Abi as viemErc20Abi } from 'viem';
import { Token, NativeCurrency, WETH9, Ether, ChainId } from '@uniswap/sdk-core';
import {
    SwapField,
    TradeDetails,
    useSwap,
    XTM as XTM_DEFINITIONS,
    USDC as USDC_DEFINITIONS,
    DAI as DAI_DEFINITIONS,
    EnabledTokens as EnabledTokensEnum,
} from '@app/hooks/swap/useSwapV2'; // Adjust path as needed

export interface SelectableTokenInfo {
    label: string;
    symbol: string;
    address: `0x${string}` | null;
    iconSymbol: string;
    definition: Token | NativeCurrency;
    balance?: string;
    usdValue?: string; // Total USD value of the balance
    rawBalance?: bigint;
    decimals: number;
    pricePerTokenUSD?: number; // Price of 1 token in USD
}

const formatDisplayBalanceForSelectable = (
    rawBalance: bigint | undefined,
    decimals: number,
    symbol: string
): string => {
    const symbolDisplay = symbol.toLowerCase() === 'dai' ? 'wXTM' : symbol;
    if (rawBalance === undefined) return '0.000';
    // Show more precision for balances in the list if desired
    return `${parseFloat(viemFormatUnits(rawBalance, decimals)).toFixed(Math.min(decimals, 5))} ${symbolDisplay}`;
};

// Placeholder for fetching USD prices - REPLACE THIS
const fetchTokenPriceUSD = async (tokenSymbol: string, chainId: ChainId | undefined): Promise<number | undefined> => {
    // MOCK IMPLEMENTATION - REPLACE WITH ACTUAL API/ORACLE CALL
    console.log(`MOCK: Fetching price for ${tokenSymbol} on chain ${chainId}`);
    await new Promise((resolve) => setTimeout(resolve, 150)); // Simulate network delay
    if (tokenSymbol === 'ETH' || tokenSymbol === 'WETH') return 3000.0;
    if (tokenSymbol === 'USDC') return 1.0;
    if (tokenSymbol === 'DAI') return 0.99;
    if (tokenSymbol === 'wXTM') return 0.55;
    return undefined;
};

export const useSwapData = () => {
    const connectedAccount = useAccount();
    const addToast = useToastStore((s) => s.addToast);

    const [fromAmount, setFromAmount] = useState<string>('');
    const [targetAmount, setTargetAmount] = useState<string>('');
    const [lastUpdatedField, setLastUpdatedField] = useState<SwapField>('fromValue');
    const [uiDirection, setUiDirection] = useState<'input' | 'output'>('input');

    const [reviewSwap, setReviewSwap] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [procesingOpen, setProcesingOpen] = useState(false);
    const [isProcessingApproval, setIsProcessingApproval] = useState(false);
    const [isProcessingSwap, setIsProcessingSwap] = useState(false);
    const [swapSuccess, setSwapSuccess] = useState(false);
    const [tokenSelectOpen, setTokenSelectOpen] = useState(false);

    const [priceImpact, setPriceImpact] = useState<string | null>(null);
    const [networkFee, setNetworkFee] = useState<string | null>(null);
    const [slippage, setSlippage] = useState<string | null>(null);
    const [transactionId, setTransactionId] = useState<string | null>(null);
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
        error: useSwapError,
    } = useSwap();

    const currentChainId = useMemo(() => connectedAccount.chain?.id, [connectedAccount.chain]);

    const fromUiTokenDefinition = useMemo(
        () => (uiDirection === 'input' ? swapEngineInputToken : swapEngineOutputToken),
        [uiDirection, swapEngineInputToken, swapEngineOutputToken]
    );
    const toUiTokenDefinition = useMemo(
        () => (uiDirection === 'input' ? swapEngineOutputToken : swapEngineInputToken),
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
            symbol: def?.symbol || balData?.symbol || '',
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
            symbol: def?.symbol || balData?.symbol || '',
            address: def?.isNative ? null : (def?.address as `0x${string}`) || null,
            iconSymbol: def?.symbol?.toLowerCase() || '',
            definition: def || XTM_DEFINITIONS[currentChainId || ChainId.MAINNET]!,
            balance,
            rawBalance: balData?.value,
            decimals,
            pricePerTokenUSD: toTokenPrice,
            usdValue: usdValStr,
        };
    }, [rawToTokenBalanceData, toUiTokenDefinition, currentChainId, toTokenPrice]);

    const notEnoughBalance = useMemo(() => {
        if (!fromTokenDisplay.rawBalance || !fromAmount || !fromTokenDisplay.decimals) return false;
        try {
            const amountBigInt = viemParseUnits(fromAmount, fromTokenDisplay.decimals);
            return amountBigInt > fromTokenDisplay.rawBalance;
        } catch {
            return true;
        }
    }, [fromTokenDisplay.rawBalance, fromAmount, fromTokenDisplay.decimals]);

    const baseSelectableTokensForList = useMemo((): Omit<
        SelectableTokenInfo,
        'balance' | 'usdValue' | 'rawBalance' | 'pricePerTokenUSD'
    >[] => {
        if (!currentChainId) return [];
        const xtmDef = XTM_DEFINITIONS[currentChainId];
        const tokens: Omit<SelectableTokenInfo, 'balance' | 'usdValue' | 'rawBalance' | 'pricePerTokenUSD'>[] = [];

        const nativeEth = Ether.onChain(currentChainId);
        if (nativeEth && (!xtmDef || !nativeEth.equals(xtmDef))) {
            const symbol = nativeEth.symbol;
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
            let tokenDefinitionFromEnum: typeof xtmDef; // e.g., Token | undefined

            switch (tokenKey) {
                case EnabledTokensEnum.DAI:
                    tokenDefinitionFromEnum = DAI_DEFINITIONS[currentChainId];
                    break;
                // case EnabledTokensEnum.USDC:
                //     tokenDefinitionFromEnum = USDC_DEFINITIONS[currentChainId];
                //     break;
                case EnabledTokensEnum.WETH:
                    tokenDefinitionFromEnum = WETH9[currentChainId];
                    break;
                case EnabledTokensEnum.XTM:
                case EnabledTokensEnum.wXTM:
                    tokenDefinitionFromEnum = xtmDef;
                    break;
                default:
                    tokenDefinitionFromEnum = undefined; // Handles any other enum values
            }

            if (tokenDefinitionFromEnum?.address && (!xtmDef || !tokenDefinitionFromEnum.equals(xtmDef))) {
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
                if (!tokenPrices[token.symbol]) {
                    newPrices[token.symbol] = await fetchTokenPriceUSD(token.symbol, currentChainId);
                } else {
                    newPrices[token.symbol] = tokenPrices[token.symbol];
                }
            });
            await Promise.all(promises);
            setTokenPrices((prev) => ({ ...prev, ...newPrices }));
            setIsLoadingPrices(false);
        };
        fetchAllPrices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [baseSelectableTokensForList, currentChainId]); // Removed tokenPrices from dep array to avoid loop

    const selectableFromTokens = useMemo((): SelectableTokenInfo[] => {
        return baseSelectableTokensForList
            .map((baseToken) => {
                let rawBalance: bigint | undefined;
                let balanceStr: string;

                if (baseToken.address === null) {
                    rawBalance = nativeTokenBalanceDataForList?.value;
                    balanceStr = formatDisplayBalanceForSelectable(rawBalance, baseToken.decimals, baseToken.symbol);
                } else {
                    const contractIndex = selectableTokensContracts.findIndex(
                        (c) => c.address.toLowerCase() === baseToken.address?.toLowerCase()
                    );
                    const balanceResult =
                        contractIndex !== -1 && erc20BalancesData ? erc20BalancesData[contractIndex] : undefined;
                    if (balanceResult?.status === 'success') {
                        rawBalance = balanceResult.result as bigint;
                    }
                    balanceStr = formatDisplayBalanceForSelectable(rawBalance, baseToken.decimals, baseToken.symbol);
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
                // Optional: Sort by USD value descending, then by balance
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
        setTradeDetails(null);
        setPriceImpact(null);
        setNetworkFee(null);
        setSlippage(null);
        // Only clear the field that was *not* last updated by the user,
        // and only if it's not already empty to prevent re-renders/loops.
        if (lastUpdatedField === 'fromValue') {
            if (targetAmount !== '') setTargetAmount('');
        } else {
            // lastUpdatedField === 'target'
            if (fromAmount !== '') setFromAmount('');
        }
    }, [lastUpdatedField, fromAmount, targetAmount]); // Add fromAmount, targetAmount as dependencies

    const shouldCalculate = useRef(false);
    const calcRef = useRef<NodeJS.Timeout | null>(null);

    const calcAmounts = useCallback(async () => {
        let amountTypedByUserStr: string;
        let tokenUsedForParsingAmount: Token | NativeCurrency | undefined;
        // This tells getTradeDetails if the parsed amount (amountForCalcWei) is for
        // the trade's actual input (sdkToken0) or actual output (sdkToken1).
        let amountTypeForGetTradeDetails: SwapField = 'target';

        const tradeInputTokenSDK = sdkToken0; // Actual input to the Uniswap trade (Token)
        const tradeOutputTokenSDK = sdkToken1; // Actual output from the Uniswap trade (Token)

        // Determine which UI field the user typed in and get the amount string and token definition
        if (lastUpdatedField === 'fromValue') {
            // User typed in the UI "FROM" box
            amountTypedByUserStr = fromAmount;
            tokenUsedForParsingAmount = fromUiTokenDefinition;
        } else {
            // lastUpdatedField === 'target', user typed in the UI "TO" box
            amountTypedByUserStr = targetAmount;
            tokenUsedForParsingAmount = toUiTokenDefinition;
        }

        if (uiDirection === 'input') {
            amountTypeForGetTradeDetails = lastUpdatedField === 'fromValue' ? 'fromValue' : 'target';
        } else {
            amountTypeForGetTradeDetails = lastUpdatedField === 'fromValue' ? 'target' : 'fromValue';
        }

        if (
            !tokenUsedForParsingAmount ||
            !amountTypedByUserStr ||
            Number.isNaN(Number(amountTypedByUserStr)) ||
            Number(amountTypedByUserStr) <= 0 ||
            !tradeInputTokenSDK ||
            !tradeOutputTokenSDK
        ) {
            // Call the refined clearCalculatedDetails to only clear the other field
            clearCalculatedDetails();
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            // Parse the user's input string using the decimals of the token definition
            // associated with the UI field they typed into.
            const amountForCalcWei = viemParseUnits(amountTypedByUserStr, tokenUsedForParsingAmount.decimals);

            // Call getTradeDetails with the parsed amount and specify if it's for the trade's input (sdkToken0) or output (sdkToken1)
            const details = await getTradeDetails(amountForCalcWei.toString(), amountTypeForGetTradeDetails);
            setTradeDetails(details);

            if (details.trade) {
                setPriceImpact(details.trade.priceImpact.toSignificant(2) + '%');
                const networkFee = details.estimatedGasFeeNative || details.estimatedGasFeeUSD;
                if (networkFee) setNetworkFee(networkFee);
                setSlippage(details.trade.priceImpact.toSignificant(2) + '% (Price Impact)'); // Consider actual slippage setting

                const lastUpdatedFieldAmount = lastUpdatedField === 'fromValue' ? fromAmount : targetAmount;

                if (shouldCalculate.current) {
                    if (lastUpdatedField === 'fromValue') {
                        if (uiDirection === 'input') {
                            const newTargetAmount = details.midPrice
                                ? Number(details.midPrice.invert().toSignificant(6)) * Number(lastUpdatedFieldAmount)
                                : 0;
                            if (newTargetAmount) setTargetAmount(newTargetAmount.toString());
                            else if (targetAmount !== '') setTargetAmount('');
                        } else {
                            if (details.inputAmount) setTargetAmount(details.inputAmount.toSignificant(6));
                            else if (targetAmount !== '') setTargetAmount('');
                        }
                    } else {
                        if (uiDirection === 'input') {
                            const newFromAmount = details.midPrice
                                ? Number(details.midPrice.toSignificant(6)) * Number(lastUpdatedFieldAmount)
                                : 0;
                            if (newFromAmount) setFromAmount(newFromAmount.toString());
                            else if (fromAmount !== '') setFromAmount('');
                        } else {
                            if (details.outputAmount) setFromAmount(details.outputAmount.toSignificant(6));
                            else if (fromAmount !== '') setFromAmount('');
                        }
                    }
                } else {
                    clearCalculatedDetails(); // Clears the other field
                    if (details.route && !details.trade) {
                        addToast({ title: 'Error', text: 'Insufficient liquidity for this trade.', type: 'error' });
                    }
                }
            }
        } catch (e: any) {
            addToast({ title: 'Calculation Error', text: e.message || 'Failed to get quote.', type: 'error' });
            clearCalculatedDetails(); // Clears the other field
        } finally {
            setIsLoading(false);
            shouldCalculate.current = false;
        }
    }, [
        fromAmount,
        targetAmount,
        lastUpdatedField,
        uiDirection,
        sdkToken0, // tradeInputTokenSDK
        sdkToken1, // tradeOutputTokenSDK
        fromUiTokenDefinition, // Token definition for UI FROM box
        toUiTokenDefinition, // Token definition for UI TO box
        getTradeDetails,
        clearCalculatedDetails, // Now a dependency
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
    }, [fromAmount, targetAmount, lastUpdatedField, uiDirection, debounceCalc]);

    const handleNumberInput = (value: string, field: SwapField) => {
        setReviewSwap(false);
        setTransactionId(null);
        const currentUiTokenDef = field === 'fromValue' ? fromUiTokenDefinition : toUiTokenDefinition;
        const maxDecimals = currentUiTokenDef?.decimals ?? 18;
        let processedValue = value;

        if (processedValue === '' || processedValue === '.' || processedValue === '0') {
            if (field === 'fromValue') {
                setFromAmount(processedValue);
                if (targetAmount !== '') setTargetAmount(''); // Clear other field
            } else {
                // field === 'target'
                setTargetAmount(processedValue);
                if (fromAmount !== '') setFromAmount(''); // Clear other field
            }
            setLastUpdatedField(field); // Set this to know which field was just interacted with
            shouldCalculate.current = false;
            // Clear only trade details, not the input field being typed into beyond what's done above
            setTradeDetails(null);
            setPriceImpact(null);
            setNetworkFee(null);
            setSlippage(null);
            setIsLoading(false);
            if (calcRef.current) clearTimeout(calcRef.current);
            return;
        }
        // ... (rest of the validation and processing logic) ...
        const regex = /^\d*\.?\d*$/;
        if (!regex.test(processedValue) || (processedValue !== '.' && Number.isNaN(Number(processedValue)))) return;
        if (processedValue.length > 1 && processedValue.startsWith('0') && !processedValue.startsWith('0.'))
            processedValue = processedValue.substring(1);
        const parts = processedValue.split('.');
        if (parts[1] && parts[1].length > maxDecimals)
            processedValue = `${parts[0]}.${parts[1].substring(0, maxDecimals)}`;

        if (field === 'fromValue') setFromAmount(processedValue);
        else setTargetAmount(processedValue);
        setLastUpdatedField(field); // Ensure this is set
        shouldCalculate.current = true;
        setIsLoading(true); // Triggers useEffect for debounceCalc
    };

    const handleSetUiDirection = useCallback(() => {
        const newUiDirection = uiDirection === 'input' ? 'output' : 'input';
        setUiDirection(newUiDirection);
        setSwapEngineDirection(newUiDirection); // This updates 'direction' in useSwapV2

        if (lastUpdatedField === 'fromValue' && fromAmount && Number(fromAmount) > 0) {
            shouldCalculate.current = true;
            setIsLoading(true); // This will trigger the useEffect for debounceCalc
        } else if (lastUpdatedField === 'target' && targetAmount && Number(targetAmount) > 0) {
            shouldCalculate.current = true;
            setIsLoading(true);
        } else if (fromAmount && Number(fromAmount) > 0) {
            // Fallback if lastUpdatedField was reset
            setLastUpdatedField('fromValue'); // Assume fromAmount should drive if it has a value
            shouldCalculate.current = true;
            setIsLoading(true);
        } else if (targetAmount && Number(targetAmount) > 0) {
            // Fallback
            setLastUpdatedField('target'); // Assume targetAmount should drive
            shouldCalculate.current = true;
            setIsLoading(true);
        } else {
            shouldCalculate.current = false;
            // Only clear calculated trade details, not the amounts in the input boxes
            setTradeDetails(null);
            setPriceImpact(null);
            setNetworkFee(null);
            setSlippage(null);
            // If both amounts are zero/empty, ensure loading is false
            if (!(fromAmount && Number(fromAmount) > 0) && !(targetAmount && Number(targetAmount) > 0)) {
                setIsLoading(false);
            }
        }
    }, [uiDirection, setSwapEngineDirection, fromAmount, targetAmount, lastUpdatedField]);

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
        setProcesingOpen(true);
        setReviewSwap(false);
        checkAndRequestApproval(amountInWeiString)
            .then((approved) => {
                setIsProcessingApproval(false);
                if (!approved) {
                    setProcesingOpen(false);
                    addToast({ title: 'Approval Required', text: 'Approval failed.', type: 'warning' });
                    return;
                }
                setIsProcessingSwap(true);
                executeSwap(tradeDetails.trade!)
                    .then((hash) => {
                        setIsProcessingSwap(false);
                        if (!hash) {
                            setProcesingOpen(false);
                            addToast({ title: 'Swap Failed', text: 'Transaction failed.', type: 'error' });
                            return;
                        }
                        setSwapSuccess(true);
                        setTransactionId(hash);
                        addToast({ title: 'Swap Submitted', text: 'Transaction sent.', type: 'success' });
                    })
                    .catch((e: any) => {
                        setIsProcessingSwap(false);
                        setProcesingOpen(false);
                        addToast({ title: 'Swap Error', text: e.message || 'Swap execution failed.', type: 'error' });
                    });
            })
            .catch((e: any) => {
                setIsProcessingApproval(false);
                setProcesingOpen(false);
                addToast({ title: 'Approval Error', text: e.message || 'Approval process failed.', type: 'error' });
            });
    };

    const displayPrice = useMemo(() => {
        if (!tradeDetails?.midPrice) return null;

        let price;
        if (uiDirection === 'input') {
            // Price is sdkToken1 per sdkToken0
            price = tradeDetails?.midPrice;
        } else {
            // uiDirection === 'output'
            // Price is sdkToken0 per sdkToken1 (inverse)
            try {
                price = tradeDetails?.midPrice?.invert();
            } catch (e) {
                console.error('Error inverting price:', e);
                return null; // Cannot invert price
            }
        }

        // Format the price for display, e.g., "1 ETH = 3000 USDC" or "1 USDC = 0.00033 ETH"
        // The price object has baseToken (denominator) and quoteToken (numerator)
        // For display, we want 1 [baseToken] = X [quoteToken]
        const baseTokenSymbol = price?.baseToken?.symbol;
        const quoteTokenSymbol = price?.quoteToken?.symbol;
        const priceValue = price.toSignificant(6); // Adjust precision as needed

        return `1 ${baseTokenSymbol} = ${priceValue} ${quoteTokenSymbol}`;
    }, [tradeDetails?.midPrice, uiDirection]);

    const transactionForDisplay = useMemo(
        () => ({
            amount: uiDirection === 'input' ? fromAmount : targetAmount, // Amount user gives
            targetAmount: uiDirection === 'input' ? targetAmount : fromAmount, // Amount user gets
            direction: uiDirection, // Can keep this if needed elsewhere
            slippage,
            networkFee,
            priceImpact,
            transactionId,
        }),
        [fromAmount, targetAmount, uiDirection, slippage, networkFee, priceImpact, transactionId]
    );

    const handleSelectFromToken = useCallback(
        (selectedToken: SelectableTokenInfo) => {
            setPairTokenAddress(selectedToken.address);
            setLastUpdatedField('fromValue');
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
        procesingOpen,
        setProcesingOpen,
        isProcessingApproval,
        isProcessingSwap,
        swapSuccess,
        fromAmount,
        setFromAmount: (val: string) => handleNumberInput(val, 'fromValue'),
        targetAmount,
        setTargetAmount: (val: string) => handleNumberInput(val, 'target'),
        uiDirection,
        setUiDirection: handleSetUiDirection,
        handleConfirm,
        transaction: transactionForDisplay,
        useSwapError,
        handleSelectFromToken,
        selectableFromTokens,
        tokenSelectOpen,
        setTokenSelectOpen,
        displayPrice,
    };
};
