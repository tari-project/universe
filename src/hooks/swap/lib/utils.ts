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
    const balance = parseFloat(viemFormatUnits(rawBalance, decimals)).toFixed(Math.min(decimals, 5));
    return `${parseFloat(balance)} ${symbol}`;
};

// ========== RETRY HELPER FUNCTION ==========
/**
 * Retries an async function a specified number of times with a delay.
 * @param fnContext A string for logging context.
 * @param asyncFn The async function to retry.
 * @param maxAttempts Total number of attempts (e.g., 3 for 1 initial + 2 retries).
 * @param delayMs Delay between retries in milliseconds.
 * @param onRetry Optional callback executed on each retry attempt.
 * @returns Promise<T> The result of the async function if successful.
 * @throws The error from the last attempt if all attempts fail.
 */
export async function retryAsync<T>(
    fnContext: string,
    asyncFn: () => Promise<T>,
    maxAttempts = 3, // Default to 1 initial attempt + 2 retries
    delayMs = 1000, // Default to 1 second delay
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onRetry?: (context: string, error: any, attempt: number, maxAttempts: number) => void
): Promise<T> {
    let attempts = 0;
    while (true) {
        attempts++;
        try {
            if (attempts > 1) console.info(`[RetryAsync][${fnContext}] Attempt ${attempts}/${maxAttempts}...`);
            return await asyncFn();
        } catch (error) {
            if (onRetry) {
                onRetry(fnContext, error, attempts, maxAttempts);
            }
            if (attempts >= maxAttempts) {
                console.error(
                    `[RetryAsync][${fnContext}] Function failed after ${maxAttempts} attempts. Last error:`,
                    error
                );
                throw error; // Re-throw the last error
            }
            // Wait before retrying, but not after the last failed attempt
            if (delayMs > 0) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
    }
}
