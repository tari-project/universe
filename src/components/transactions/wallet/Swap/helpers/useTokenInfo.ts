import { useState, useEffect, useMemo, useCallback } from 'react';
import { useBalance } from 'wagmi';
import { Ether, NativeCurrency, Token } from '@uniswap/sdk-core';
import { XTM_SDK_TOKEN } from '@app/hooks/swap/lib/constants';
import { fetchTokenPriceUSD, formatDisplayBalanceForSelectable } from '@app/hooks/swap/lib/utils';
import { formatUnits } from 'viem';
import { TokenSymbol } from '../useSwapData';

export interface SelectableTokenInfo {
    label: string;
    symbol: TokenSymbol;
    address: `0x${string}` | null;
    iconSymbol: string;
    definition: Token | NativeCurrency;
    balance: string;
    rawBalance?: bigint;
    decimals: number;
    pricePerTokenUSD?: number;
    usdValue?: string;
}

interface UseTokenDisplayInfoProps {
    uiTokenDefinition?: Token | NativeCurrency;
    chainId?: number;
    accountAddress?: `0x${string}`;
    fallbackDefinition?: Token | NativeCurrency;
}

export function useTokenDisplayInfo({
    uiTokenDefinition,
    chainId,
    accountAddress,
    fallbackDefinition,
}: UseTokenDisplayInfoProps) {
    const [tokenPrice, setTokenPrice] = useState<number | undefined>();
    const [isFetchingPrice, setIsFetchingPrice] = useState<boolean>(false);

    const {
        data: rawBalanceData,
        isLoading: isLoadingBalance,
        refetch: refetchBalance,
    } = useBalance({
        address: accountAddress,
        token: uiTokenDefinition?.isNative ? undefined : (uiTokenDefinition?.address as `0x${string}`),
        chainId: chainId,
    });

    const fetchPrice = useCallback(async () => {
        if (uiTokenDefinition?.symbol && chainId) {
            setIsFetchingPrice(true);
            try {
                const price = await fetchTokenPriceUSD(uiTokenDefinition.symbol, chainId);
                setTokenPrice(price);
            } catch (error) {
                console.error('Failed to fetch token price:', error);
                setTokenPrice(undefined); // Or handle error state
            } finally {
                setIsFetchingPrice(false);
            }
        } else {
            setTokenPrice(undefined);
        }
    }, [uiTokenDefinition, chainId]);

    useEffect(() => {
        fetchPrice();
    }, [fetchPrice]);

    const tokenDisplayInfo = useMemo((): SelectableTokenInfo | undefined => {
        if (!chainId) return undefined; // Guard against undefined chainId for fallback

        const def = uiTokenDefinition;
        const balData = rawBalanceData;

        // Determine decimals: prefer definition, then balance data, then default
        const decimals = def?.decimals || balData?.decimals || 18;

        const displaySymbol =
            def?.symbol ||
            balData?.symbol ||
            (fallbackDefinition && 'symbol' in fallbackDefinition ? fallbackDefinition.symbol : 'ETH') ||
            '';

        const balance = formatDisplayBalanceForSelectable(balData?.value, decimals, displaySymbol);

        let usdValStr: string | undefined;
        if (balData?.value !== undefined && tokenPrice !== undefined) {
            const numBal = parseFloat(formatUnits(balData.value, decimals));
            usdValStr = `$${(numBal * tokenPrice).toFixed(2)}`;
        }

        const effectiveDefinition =
            def || fallbackDefinition || (chainId ? Ether.onChain(chainId) : undefined) || XTM_SDK_TOKEN[chainId]!;

        return {
            label:
                def?.name ||
                def?.symbol ||
                ((fallbackDefinition && 'name' in fallbackDefinition ? fallbackDefinition.name : 'Token') as string),
            symbol: displaySymbol.toUpperCase() as TokenSymbol,
            address: def?.isNative ? null : (def?.address as `0x${string}`) || null,
            iconSymbol: def?.symbol?.toLowerCase() || '',
            definition: effectiveDefinition,
            balance,
            rawBalance: balData?.value,
            decimals,
            pricePerTokenUSD: tokenPrice,
            usdValue: usdValStr,
        };
    }, [rawBalanceData, uiTokenDefinition, chainId, tokenPrice, fallbackDefinition]);

    const refetch = useCallback(async () => {
        const pricePromise = fetchPrice(); // Re-trigger price fetch
        const balancePromise = refetchBalance?.(); // Re-trigger balance fetch (if available)
        await Promise.all([pricePromise, balancePromise]);
    }, [fetchPrice, refetchBalance]);

    return {
        tokenDisplayInfo,
        isLoading: isLoadingBalance || isFetchingPrice,
        refetch,
        rawBalanceData,
        tokenPrice,
    };
}
