import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { addToast } from '@app/components/ToastStack/useToastStore';
import { useBackgroundClaimSubmission } from '../claim/useBackgroundClaimSubmission';
import { KEY_CSRF_TOKEN } from '../claim/useCsrfToken';
import type { TrancheClaimResult } from '@app/types/airdrop-claim';
import { KEY_TRANCHE_STATUS } from './useTrancheStatus';

// Helper function to format numbers with proper rounding
const formatAmount = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null) return '0';

    // Round to 2 decimals if needed, otherwise show as integer
    const rounded = Math.round(amount * 100) / 100;
    return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2);
};

export function useTrancheClaimSubmission() {
    const { t } = useTranslation('airdrop', { useSuspense: false });
    const queryClient = useQueryClient();

    // Use the existing working background claim submission with tranche support
    const { performBackgroundClaim, isProcessing, error, reset } = useBackgroundClaimSubmission();

    const submitTrancheClaimWithOtp = useCallback(
        async (trancheId: string): Promise<TrancheClaimResult | undefined> => {
            console.info('🚀 submitTrancheClaimWithOtp called with trancheId:', trancheId);

            try {
                // Invalidate CSRF token to force fresh fetch
                console.debug('Invalidating CSRF token cache for fresh fetch');
                queryClient.invalidateQueries({ queryKey: [KEY_CSRF_TOKEN] });

                // Wait a bit for the fresh CSRF token to be fetched
                await new Promise((resolve) => setTimeout(resolve, 500));

                console.debug('Calling performBackgroundClaim with xtm and trancheId:', trancheId);
                const result = await performBackgroundClaim('xtm', trancheId);

                if (result?.success) {
                    addToast({
                        type: 'success',
                        title: t('tranche.notifications.claim-success'),
                        text: t('tranche.notifications.claim-success-message', { amount: formatAmount(result.amount) }),
                        timeout: 5000,
                    });

                    // Invalidate tranche status to refresh the data
                    queryClient.invalidateQueries({ queryKey: [KEY_TRANCHE_STATUS] });

                    return {
                        success: true,
                        transactionId: result.transactionId,
                        amount: result.amount,
                        claimId: '',
                        trackingId: '',
                        trancheId,
                    };
                } else {
                    console.error(result?.error || 'Claim failed');
                }
            } catch (error) {
                addToast({
                    type: 'error',
                    title: t('tranche.notifications.claim-failed'),
                    text: error instanceof Error ? error.message : t('tranche.notifications.claim-failed'),
                    timeout: 5000,
                });
                throw error;
            }
        },
        [performBackgroundClaim, queryClient, t]
    );

    return {
        submitTrancheClaimWithOtp,
        isLoading: isProcessing,
        error,
        canClaim: !isProcessing, // Can claim when not processing
        otpState: { currentStep: 'complete' as const, isProcessing, error: error || null },
        claimResult: null,
        reset,
    };
}
