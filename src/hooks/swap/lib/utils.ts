import { PublicClient, WalletClient, formatUnits as viemFormatUnits } from 'viem';
import { BrowserProvider, Signer as EthersSigner } from 'ethers';
import { ChainId, CurrencyAmount, Token, NativeCurrency } from '@uniswap/sdk-core';

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

    // Handle "small" numbers (but not "very small")
    // These are >= displayThresholdMinVal and < bigNumberThreshold
    // toSignificant is generally good here and shouldn't produce 'e' notation for this range.
    return amount.toSignificant(significantDigitsForSmall);
}

export interface EstimatedGasFees {
    estimatedGasFeeNative: string | null;
    estimatedGasFeeUSD: string | null;
    gasLimit: bigint | null;
    gasPrice: bigint | null;
    error?: string; // Optional error message if estimation fails
}

interface EstimateTransactionGasFeesParams {
    publicClient: PublicClient;
    accountAddress: `0x${string}`;
    toAddress: `0x${string}`;
    callData: `0x${string}`;
    valueToSend?: bigint;
    nativeCurrencyPriceUSD?: number;
    nativeCurrencyDecimals: number;
    nativeCurrencySymbol: string;
    retryMaxAttempts?: number;
    retryDelayMs?: number;
}

export async function estimateTransactionGasFees(params: EstimateTransactionGasFeesParams): Promise<EstimatedGasFees> {
    const {
        publicClient,
        accountAddress,
        toAddress,
        callData,
        valueToSend,
        nativeCurrencyPriceUSD,
        nativeCurrencyDecimals,
        nativeCurrencySymbol,
        retryMaxAttempts = 3, // Default max attempts
        retryDelayMs = 500, // Default delay
    } = params;

    let estimatedGasLimitBI: bigint | null = null;
    let gasPriceBI: bigint | null = null;

    try {
        const estimateGasCallParams = {
            account: accountAddress,
            to: toAddress,
            data: callData,
            value: valueToSend,
        };

        const estimateGasLimitFn = () => publicClient.estimateGas(estimateGasCallParams);
        const getGasPriceFn = () => publicClient.getGasPrice();
        const gasContext = 'estimateTransactionGasFees';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const onRetryCb = (ctx: string, err: any, attempt: number, max: number) => {
            console.warn(`[${ctx}] Attempt ${attempt}/${max} failed:`, err.shortMessage || err.message || err);
        };

        estimatedGasLimitBI = await retryAsync(
            `${gasContext}.estimateGasLimit`,
            estimateGasLimitFn,
            retryMaxAttempts,
            retryDelayMs,
            onRetryCb
        );

        gasPriceBI = await retryAsync(
            `${gasContext}.getGasPrice`,
            getGasPriceFn,
            retryMaxAttempts,
            retryDelayMs,
            onRetryCb
        );

        if (estimatedGasLimitBI && gasPriceBI) {
            const estimatedTotalGasCostNative = estimatedGasLimitBI * gasPriceBI;
            const nativeFeeStr = formatNativeGasFee(
                estimatedTotalGasCostNative,
                nativeCurrencyDecimals,
                nativeCurrencySymbol
            );
            let usdFeeStr: string | null = null;
            if (nativeCurrencyPriceUSD) {
                const feeInNativeNum = parseFloat(viemFormatUnits(estimatedTotalGasCostNative, nativeCurrencyDecimals));
                usdFeeStr = formatGasFeeUSD(feeInNativeNum, nativeCurrencyPriceUSD);
            }
            return {
                estimatedGasFeeNative: nativeFeeStr,
                estimatedGasFeeUSD: usdFeeStr,
                gasLimit: estimatedGasLimitBI,
                gasPrice: gasPriceBI,
            };
        }
        // This case (one null, one not) should ideally not happen if retryAsync re-throws
        return {
            estimatedGasFeeNative: null,
            estimatedGasFeeUSD: null,
            gasLimit: estimatedGasLimitBI, // Could be null
            gasPrice: gasPriceBI, // Could be null
            error: 'Gas estimation partially succeeded or one component failed silently.',
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (gasError: any) {
        const errorMessage = gasError.shortMessage || gasError.message || 'Unknown gas estimation error';
        console.warn('Gas estimation failed after all retries in estimateTransactionGasFees:', errorMessage);
        return {
            estimatedGasFeeNative: null,
            estimatedGasFeeUSD: null,
            gasLimit: null,
            gasPrice: null,
            error: errorMessage,
        };
    }
}
