import { WalletClient, formatUnits as viemFormatUnits } from 'viem';
import { BrowserProvider, Signer as EthersSigner } from 'ethers';
import { ChainId, CurrencyAmount, Token, NativeCurrency } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';

export async function walletClientToSigner(walletClient: WalletClient): Promise<EthersSigner | null> {
    const { account, chain, transport } = walletClient;
    if (!account || !chain || !transport) {
        console.warn('walletClientToSigner: Missing account, chain, or transport');
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
    minFractionDigits = 2
): string | null => {
    const nativeDecimals = nativeDecimalsParam ?? 18;
    const nativeSymbol = nativeSymbolParam ?? 'ETH';
    if (gasAmountWei === undefined) return null;
    try {
        const formatted = viemFormatUnits(gasAmountWei, nativeDecimals);
        const numericValue = parseFloat(formatted);
        if (isNaN(numericValue)) return `${formatted} ${nativeSymbol}`;

        const formatter = new Intl.NumberFormat(undefined, {
            minimumFractionDigits: minFractionDigits,
            maximumFractionDigits: Math.max(minFractionDigits, 8),
        });
        return `${formatter.format(numericValue)} ${nativeSymbol}`;
    } catch {
        return null;
    }
};

export const fetchTokenPriceUSD = async (
    _tokenSymbol: string,
    _chainId: ChainId | undefined
): Promise<number | undefined> => {
    return undefined;
};

interface FormatBalanceOptions {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    displayThresholdMinVal?: number;
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
        maximumFractionDigits = 4,
        displayThresholdMinVal = 0.000001,
        locale = undefined,
    } = options || {};

    if (rawBalance === undefined) {
        const zeroFormatter = new Intl.NumberFormat(locale, {
            minimumFractionDigits: minimumFractionDigits,
            maximumFractionDigits: minimumFractionDigits,
            useGrouping: true,
        });
        return `${zeroFormatter.format(0)} ${symbol}`;
    }

    const formattedUnitsStr = viemFormatUnits(rawBalance, decimals);
    const numericValue = parseFloat(formattedUnitsStr);

    if (isNaN(numericValue)) {
        const fallbackFormatter = new Intl.NumberFormat(locale, {
            minimumFractionDigits: minimumFractionDigits,
            maximumFractionDigits: minimumFractionDigits,
            useGrouping: true,
        });
        return `${fallbackFormatter.format(0)} ${symbol}`;
    }

    if (displayThresholdMinVal > 0 && numericValue > 0 && numericValue < displayThresholdMinVal) {
        const thresholdStr = displayThresholdMinVal.toString();
        const numFracDigitsInThreshold = thresholdStr.includes('.') ? thresholdStr.split('.')[1].length : 0;
        let displayThresholdFormatted: string;
        if (numFracDigitsInThreshold > 0) {
            displayThresholdFormatted = `0.${'0'.repeat(numFracDigitsInThreshold - 1)}1`;
        } else {
            displayThresholdFormatted = displayThresholdMinVal.toString();
        }
        return `< ${displayThresholdFormatted} ${symbol}`;
    }

    const actualMaxFractionDigits = Math.min(maximumFractionDigits, decimals);
    const actualMinFractionDigits = Math.min(minimumFractionDigits, actualMaxFractionDigits);

    const formatter = new Intl.NumberFormat(locale, {
        minimumFractionDigits: actualMinFractionDigits,
        maximumFractionDigits: actualMaxFractionDigits,
        useGrouping: true,
    });

    return `${formatter.format(numericValue)} ${symbol}`;
};

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

    if (isNaN(valueNum)) return '';
    if (valueNum === 0) return amount.toFixed(fixedDecimalsForBig);

    const absValueNum = Math.abs(valueNum);

    if (absValueNum < displayThresholdMinVal) {
        const displayThresholdStr = displayThresholdMinVal.toString();
        const numFracDigitsInThreshold = displayThresholdStr.includes('.')
            ? displayThresholdStr.split('.')[1].length
            : 0;
        if (numFracDigitsInThreshold > 0) return `< 0.${'0'.repeat(numFracDigitsInThreshold - 1)}1`;
        return `< ${displayThresholdMinVal}`;
    }
    if (absValueNum >= bigNumberThreshold) return amount.toFixed(fixedDecimalsForBig);
    return amount.toSignificant(significantDigitsForSmall);
}

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
