import { formatNumber, FormatPreset } from '@app/utils';
import { BalanceSummary } from '@app/types/airdrop-claim.ts';

export const formatAmount = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null) return '0';

    // Round to 2 decimals if needed, otherwise show as integer
    const rounded = Math.round(amount * 100) / 100;

    return formatNumber(rounded * 1_000_000, FormatPreset.XTM_LONG);
};

// Calculate remaining balance: total from claimStatus minus claimed and expired tranches
export const calculateRemainingBalance = (balanceSummary: BalanceSummary | null, totalOriginalAmount?: number) => {
    if (!totalOriginalAmount) return null;

    // Always try to subtract claimed and expired if we have tranche data
    if (balanceSummary) {
        const claimedAndExpired = balanceSummary.totalClaimed + balanceSummary.totalExpired;
        return totalOriginalAmount - claimedAndExpired;
    }

    // Fallback: show original amount if no tranche data
    console.debug('No balance summary, returning original amount');
    return totalOriginalAmount;
};
