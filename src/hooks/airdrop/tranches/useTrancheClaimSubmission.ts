import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest';
import { useWalletStore } from '@app/store';
import { addToast } from '@app/components/ToastStack/useToastStore';
import { useCsrfToken } from '../claim/useCsrfToken';
import { useAutomaticOtpClaim } from '../claim/useAutomaticOtpClaim';
import type { TrancheClaimRequest, TrancheClaimResult } from '@app/types/airdrop-claim';
import { KEY_TRANCHE_STATUS } from './useTrancheStatus';

interface TrancheClaimSubmissionResponse {
    success: boolean;
    data?: {
        claimTarget: 'xtm';
        transactionId: string;
        amount: number;
        claimId: string;
        trackingId: string;
        trancheId: string;
    };
    error?: string;
}

async function submitTrancheClaimRequest(claimRequest: TrancheClaimRequest): Promise<TrancheClaimResult> {
    const response = await handleAirdropRequest<TrancheClaimSubmissionResponse>({
        path: '/claim-airdrop',
        method: 'POST',
        body: claimRequest as unknown as Record<string, unknown>,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response?.success || !response?.data) {
        throw new Error(response?.error || 'Failed to submit tranche claim');
    }

    return {
        success: true,
        transactionId: response.data.transactionId,
        amount: response.data.amount,
        claimId: response.data.claimId,
        trackingId: response.data.trackingId,
        trancheId: response.data.trancheId,
    };
}

export function useTrancheClaimSubmission() {
    const queryClient = useQueryClient();
    const walletAddress = useWalletStore((s) => s.tari_address_base58);
    const { data: csrfData, isLoading: isLoadingCsrf, error: csrfError } = useCsrfToken();
    const { requestOtp, otpData, state: otpState, reset: resetOtp } = useAutomaticOtpClaim();

    const claimMutation = useMutation({
        mutationFn: submitTrancheClaimRequest,
        onSuccess: (result) => {
            addToast({
                type: 'success',
                title: 'Tranche Claimed Successfully',
                text: `Successfully claimed ${result.amount} XTM from tranche`,
                timeout: 5000,
            });

            // Invalidate tranche status to refresh the data
            queryClient.invalidateQueries({ queryKey: [KEY_TRANCHE_STATUS] });
            
            // Reset OTP state
            resetOtp();
        },
        onError: (error: Error) => {
            addToast({
                type: 'error',
                title: 'Claim Failed',
                text: error.message || 'Failed to claim tranche',
                timeout: 5000,
            });
            
            // Reset OTP state on error
            resetOtp();
        },
    });

    const submitTrancheClaimWithOtp = useCallback(
        async (trancheId: string): Promise<TrancheClaimResult> => {
            if (!walletAddress) {
                throw new Error('Wallet address not available');
            }

            if (!csrfData?.csrfToken) {
                throw new Error('CSRF token not available');
            }

            // Request OTP first
            await requestOtp(csrfData.csrfToken);

            // Wait for OTP to be available
            const waitForOtp = async (): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const checkOtp = () => {
                        if (otpData?.otp) {
                            resolve(otpData.otp);
                        } else if (otpState.error) {
                            reject(new Error(otpState.error));
                        } else if (otpState.currentStep === 'error') {
                            reject(new Error('OTP request failed'));
                        } else {
                            // Continue waiting
                            setTimeout(checkOtp, 100);
                        }
                    };
                    checkOtp();
                });
            };

            const otp = await waitForOtp();

            // Submit the claim
            const claimRequest: TrancheClaimRequest = {
                claimTarget: 'xtm',
                walletAddress,
                csrfToken: csrfData.csrfToken,
                otp,
                trancheId,
            };

            return claimMutation.mutateAsync(claimRequest);
        },
        [walletAddress, csrfData?.csrfToken, requestOtp, otpData?.otp, otpState, claimMutation]
    );

    const canClaim = Boolean(
        walletAddress && 
        csrfData?.csrfToken && 
        !isLoadingCsrf && 
        !csrfError &&
        !claimMutation.isPending &&
        otpState.currentStep !== 'otp-wait'
    );

    return {
        submitTrancheClaimWithOtp,
        isLoading: claimMutation.isPending || isLoadingCsrf || otpState.isProcessing,
        error: claimMutation.error || csrfError,
        canClaim,
        otpState,
        claimResult: claimMutation.data,
        reset: () => {
            claimMutation.reset();
            resetOtp();
        },
    };
}

// Simplified hook for when you just need to submit a claim without managing OTP state
export function useSimpleTrancheClaimSubmission() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: submitTrancheClaimRequest,
        onSuccess: (result) => {
            addToast({
                type: 'success',
                title: 'Tranche Claimed Successfully',
                text: `Successfully claimed ${result.amount} XTM from tranche`,
                timeout: 5000,
            });

            // Invalidate tranche status to refresh the data
            queryClient.invalidateQueries({ queryKey: [KEY_TRANCHE_STATUS] });
        },
        onError: (error: Error) => {
            addToast({
                type: 'error',
                title: 'Claim Failed',
                text: error.message || 'Failed to claim tranche',
                timeout: 5000,
            });
        },
    });
}
