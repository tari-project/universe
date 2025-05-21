import { WalletClient } from 'viem';
import { BrowserProvider, Signer as EthersSigner } from 'ethers';
import { formatUnits as viemFormatUnits } from 'viem';
import { ChainId } from '@uniswap/sdk-core';

export async function walletClientToSigner(walletClient: WalletClient): Promise<EthersSigner | null> {
    const { account, chain, transport } = walletClient;
    if (!account) {
        console.warn('walletClientToSigner: Missing account');
        return null;
    }
    if (!chain) {
        console.warn('walletClientToSigner: Missing chain');
        return null;
    }
    if (!transport) {
        console.warn('walletClientToSigner: Missing transport');
        return null;
    }
    try {
        const network = { chainId: chain.id, name: chain.name, ensAddress: chain.contracts?.ensRegistry?.address };
        const provider = new BrowserProvider(transport, network);
        return await provider.getSigner(account.address);
    } catch (e) {
        console.error('Error creating ethers signer:', e);
        return null;
    }
}

export const formatNativeGasFee = (
    gasAmountWei: bigint | undefined,
    nativeDecimals = 18,
    nativeSymbol = 'ETH'
): string | null => {
    if (gasAmountWei === undefined) return null;
    try {
        const formatted = viemFormatUnits(gasAmountWei, nativeDecimals);
        return `${parseFloat(formatted).toFixed(5)} ${nativeSymbol}`;
    } catch {
        return null;
    }
};

export const formatGasFeeUSD = (
    feeInNativeNum: number | undefined,
    nativePriceUSD: number | undefined
): string | null => {
    if (feeInNativeNum === undefined || nativePriceUSD === undefined) return null;
    const usdValue = feeInNativeNum * nativePriceUSD;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(usdValue);
};

// Placeholder for fetching USD prices - REPLACE THIS
export const fetchTokenPriceUSD = async (
    _tokenSymbol: string,
    _chainId: ChainId | undefined
): Promise<number | undefined> => {
    // MOCK IMPLEMENTATION - REPLACE WITH ACTUAL API/ORACLE CALL
    // console.warn(`MOCK: Fetching price for ${tokenSymbol} on chain ${chainId}`);
    // await new Promise((resolve) => setTimeout(resolve, 150)); // Simulate network delay
    // if (tokenSymbol === 'ETH' || tokenSymbol === 'WETH') return 3000.0;
    // if (tokenSymbol === 'wXTM') return 0.55;
    return undefined;
};

export const formatDisplayBalanceForSelectable = (
    rawBalance: bigint | undefined,
    decimals: number,
    symbol: string
): string => {
    if (rawBalance === undefined) return '0.000';
    return `${parseFloat(viemFormatUnits(rawBalance, decimals)).toFixed(Math.min(decimals, 5))} ${symbol}`;
};
