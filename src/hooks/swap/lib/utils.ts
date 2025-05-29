import { PublicClient, WalletClient, formatUnits as viemFormatUnits } from 'viem';
import { BrowserProvider, Signer as EthersSigner } from 'ethers';
import { ChainId, CurrencyAmount, Token, NativeCurrency } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';

export async function walletClientToSigner(walletClient: WalletClient | PublicClient): Promise<EthersSigner | null> {
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
    nativeDecimalsParam?: number,
    nativeSymbolParam?: string,
    minFractionDigits = 2 // Default minimum fraction digits
): string | null => {
    const nativeDecimals = nativeDecimalsParam ?? 18;
    const nativeSymbol = nativeSymbolParam ?? 'ETH'; // Default to ETH if not provided
    if (gasAmountWei === undefined) return null;
    try {
        const formatted = viemFormatUnits(gasAmountWei, nativeDecimals);
        // Use Intl.NumberFormat for better formatting control
        const numericValue = parseFloat(formatted);
        if (isNaN(numericValue)) return `${formatted} ${nativeSymbol}`; // Fallback

        const formatter = new Intl.NumberFormat(undefined, {
            // Use user's locale
            minimumFractionDigits: minFractionDigits,
            maximumFractionDigits: Math.max(minFractionDigits, 8), // Show more precision if needed, up to 8
        });
        return `${formatter.format(numericValue)} ${nativeSymbol}`;
    } catch {
        return null;
    }
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

interface FormatBalanceOptions {
    /** Minimum number of decimal places to display. Default: 2. */
    minimumFractionDigits?: number;
    /** Maximum number of decimal places to display. Default: 4. Will be capped by token's actual decimals. */
    maximumFractionDigits?: number;
    /**
     * Numbers smaller than this (but not 0) will be displayed as "< X".
     * Example: 0.00001 will display numbers like 0.0000001 as "< 0.00001".
     * Set to 0 or undefined to disable. Default: 0.000001.
     */
    displayThresholdMinVal?: number;
    /** Locale for formatting. Defaults to undefined (user's current locale). */
    locale?: string;
}

export const formatDisplayBalanceForSelectable = (
    rawBalance: bigint | undefined,
    decimals: number,
    symbol: string,
    options?: FormatBalanceOptions
): string => {
    const {
        minimumFractionDigits = 2,
        maximumFractionDigits = 4, // A common default for crypto display, adjust as needed
        displayThresholdMinVal = 0.000001,
        locale = undefined, // Uses browser/environment default
    } = options || {};

    if (rawBalance === undefined) {
        // Format "0" according to minimumFractionDigits
        const zeroFormatter = new Intl.NumberFormat(locale, {
            minimumFractionDigits: minimumFractionDigits,
            maximumFractionDigits: minimumFractionDigits, // Ensure it's exactly min digits for zero
            useGrouping: true,
        });
        return `${zeroFormatter.format(0)} ${symbol}`;
    }

    const formattedUnitsStr = viemFormatUnits(rawBalance, decimals);
    const numericValue = parseFloat(formattedUnitsStr);

    if (isNaN(numericValue)) {
        // Should not happen if viemFormatUnits works correctly
        const fallbackFormatter = new Intl.NumberFormat(locale, {
            minimumFractionDigits: minimumFractionDigits,
            maximumFractionDigits: minimumFractionDigits,
            useGrouping: true,
        });
        return `${fallbackFormatter.format(0)} ${symbol}`;
    }

    // Handle very small, non-zero numbers
    if (displayThresholdMinVal > 0 && numericValue > 0 && numericValue < displayThresholdMinVal) {
        const thresholdStr = displayThresholdMinVal.toString();
        // Create a string like "< 0.00001"
        const numFracDigitsInThreshold = thresholdStr.includes('.') ? thresholdStr.split('.')[1].length : 0;

        let displayThresholdFormatted: string;
        if (numFracDigitsInThreshold > 0) {
            displayThresholdFormatted = `0.${'0'.repeat(numFracDigitsInThreshold - 1)}1`;
        } else {
            // Fallback for thresholds like 1, 10 (though not typical for minVal)
            displayThresholdFormatted = displayThresholdMinVal.toString();
        }
        return `< ${displayThresholdFormatted} ${symbol}`;
    }

    // Ensure maximumFractionDigits does not exceed token's actual decimals
    // And that minimum is not greater than maximum
    const actualMaxFractionDigits = Math.min(maximumFractionDigits, decimals);
    const actualMinFractionDigits = Math.min(minimumFractionDigits, actualMaxFractionDigits);

    const formatter = new Intl.NumberFormat(locale, {
        minimumFractionDigits: actualMinFractionDigits,
        maximumFractionDigits: actualMaxFractionDigits,
        useGrouping: true, // This adds thousands separators
    });

    return `${formatter.format(numericValue)} ${symbol}`;
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
    onRetry?: (context: string, error: any, attempt: number, maxAttempts: number) => void,
    signal?: AbortSignal
): Promise<T> {
    let attempts = 0;
    while (true) {
        attempts++;
        if (signal?.aborted) throw new Error('Aborted');
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

/**
 * Formats a CurrencyAmount for display with different precision based on its value.
 * - Big numbers (>= bigNumberThreshold) are formatted with a fixed number of decimals.
 * - Small numbers (< bigNumberThreshold but >= displayThreshold) are formatted with a number of significant digits.
 * - Very small numbers (< displayThreshold) are displayed as "< X".
 *
 * @param amount The CurrencyAmount to format.
 * @param options Formatting options.
 * @param options.significantDigitsForSmall How many significant digits for small numbers (Default: 4).
 * @param options.fixedDecimalsForBig How many fixed decimal places for big numbers (Default: 2).
 * @param options.bigNumberThreshold Threshold to consider a number "big" (Default: 1.0).
 * @param options.displayThresholdMinVal Numbers smaller than this (but not 0) are shown as "< X" (Default: 0.000001).
 * @returns A string representing the formatted amount.
 */
export function formatAmountSmartly(
    amount: CurrencyAmount<Token | NativeCurrency> | undefined,
    options?: {
        significantDigitsForSmall?: number;
        fixedDecimalsForBig?: number;
        bigNumberThreshold?: number;
        displayThresholdMinVal?: number;
    }
): string {
    if (!amount) {
        return '';
    }

    const {
        significantDigitsForSmall = 6,
        fixedDecimalsForBig = 4,
        bigNumberThreshold = 100.0,
        displayThresholdMinVal = 0.000001,
    } = options || {};

    const valueStr = amount.toExact();
    const valueNum = parseFloat(valueStr);

    if (isNaN(valueNum)) {
        // This should ideally not happen with a valid CurrencyAmount
        return '';
    }

    if (valueNum === 0) {
        // Explicitly format zero to the 'big number' decimal style, e.g., "0.00"
        return amount.toFixed(fixedDecimalsForBig);
    }

    const absValueNum = Math.abs(valueNum);

    // Handle very small, non-zero numbers
    if (absValueNum < displayThresholdMinVal) {
        const displayThresholdStr = displayThresholdMinVal.toString();
        // Create a string like "< 0.000001"
        const numFracDigitsInThreshold = displayThresholdStr.includes('.')
            ? displayThresholdStr.split('.')[1].length
            : 0;

        if (numFracDigitsInThreshold > 0) {
            // Construct the "< 0.0...01" string
            return `< 0.${'0'.repeat(numFracDigitsInThreshold - 1)}1`;
        }
        // Fallback for thresholds like 1, 10 (though not typical for minVal)
        return `< ${displayThresholdMinVal}`;
    }

    // Handle "big" numbers
    if (absValueNum >= bigNumberThreshold) {
        return amount.toFixed(fixedDecimalsForBig);
    }

    return amount.toSignificant(significantDigitsForSmall);
}

/**
 * Encodes a path for multi-hop swaps on Uniswap V3.
 * @param tokens An array of token addresses in the path.
 * @param fees An array of fees for each pool in the path. Must be one less than tokens array length.
 * @returns The encoded path as a bytes string.
 */
export function encodePath(tokens: `0x${string}`[], fees: FeeAmount[]): `0x${string}` {
    if (tokens.length !== fees.length + 1) {
        throw new Error('Path encoding error: tokens length must be fees length + 1');
    }

    let encoded = tokens[0];

    for (let i = 0; i < fees.length; i++) {
        encoded += fees[i].toString(16).padStart(6, '0') + tokens[i + 1].substring(2);
    }
    return encoded as `0x${string}`;
}

// Helper to create the V3TradeDetails path structure
export interface TradeLeg {
    tokenIn: Token;
    tokenOut: Token;
    fee: FeeAmount;
}
