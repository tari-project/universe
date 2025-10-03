import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest';
import { useWalletStore } from '@app/store';
import { addToast } from '@app/components/ToastStack/useToastStore';
import { useCsrfToken } from './useCsrfToken';
import { useAutomaticOtpClaim } from './useAutomaticOtpClaim';
import type { ClaimRequest, ClaimResult, BackgroundClaimResult } from '@app/types/airdrop-claim';

interface ClaimSubmissionResponse {
    success: boolean;
    data?: {
        claimTarget: 'xtm' | 'usd';
        transactionId: string;
        amount: number;
        usdtAmount: number;
        claimId: string;
        trackingId: string;
    };
    error?: string;
}

async function submitClaim(claimRequest: ClaimRequest): Promise<ClaimResult> {
    const response = await handleAirdropRequest<ClaimSubmissionResponse>({
        path: '/tari/claim-airdrop',
        method: 'POST',
        body: claimRequest,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response?.success || !response?.data) {
        throw new Error(response?.error || 'Failed to submit claim');
    }

    return {
        success: true,
        transactionId: response.data.transactionId,
        amount: response.data.amount,
        usdtAmount: response.data.usdtAmount,
        claimId: response.data.claimId,
        trackingId: response.data.trackingId,
    };
}

export function useBackgroundClaimSubmission() {
    const walletAddress = useWalletStore((s) => s.tari_address_base58);
    const { data: csrfData, isLoading: isLoadingCsrf, error: csrfError } = useCsrfToken();
    const { requestOtp, otpData, state: otpState, reset: resetOtp } = useAutomaticOtpClaim();

    const claimMutation = useMutation({
        mutationFn: submitClaim,
        onSuccess: (result) => {
            addToast({
                title: 'Airdrop Claimed Successfully!',
                text: `Amount: ${result.amount} XTM • Transaction ID: ${result.transactionId}`,
                type: 'success',
                timeout: 10000,
            });
            resetOtp();
        },
        onError: (error: Error) => {
            addToast({
                title: 'Claim Failed',
                text: error.message,
                type: 'error',
                timeout: 8000,
            });
            resetOtp();
        },
    });

    const performBackgroundClaim = useCallback(async (claimTarget: 'xtm' | 'usd' = 'xtm'): Promise<BackgroundClaimResult> => {
        try {
            if (!walletAddress) {
                throw new Error('Wallet address not available');
            }

            // Step 1: Get CSRF token (if not already loaded)
            if (!csrfData?.csrfToken) {
                if (csrfError) {
                    throw new Error('Failed to get CSRF token');
                }
                if (isLoadingCsrf) {
                    throw new Error('CSRF token still loading');
                }
                throw new Error('CSRF token not available');
            }

            // Step 2: Request OTP
            await requestOtp(csrfData.csrfToken);

            // Wait for OTP to be received
            return new Promise((resolve, reject) => {
                const checkOtpStatus = () => {
                    if (otpData?.otp) {
                        // Step 3: Submit claim with OTP
                        const claimRequest: ClaimRequest = {
                            claimTarget,
                            walletAddress,
                            csrfToken: csrfData.csrfToken,
                            otp: otpData.otp,
                        };

                        claimMutation.mutate(claimRequest, {
                            onSuccess: (result) => {
                                resolve({
                                    success: true,
                                    transactionId: result.transactionId,
                                    amount: result.amount,
                                });
                            },
                            onError: (error: Error) => {
                                reject(new Error(error.message));
                            },
                        });
                    } else if (otpState.currentStep === 'error') {
                        reject(new Error(otpState.error || 'OTP request failed'));
                    } else if (otpState.currentStep !== 'complete') {
                        // Still waiting for OTP, check again soon
                        setTimeout(checkOtpStatus, 1000);
                    }
                };

                checkOtpStatus();
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            addToast({
                title: 'Claim Process Failed',
                text: errorMessage,
                type: 'error',
                timeout: 8000,
            });
            
            return {
                success: false,
                error: errorMessage,
            };
        }
    }, [walletAddress, csrfData, csrfError, isLoadingCsrf, requestOtp, otpData, otpState, claimMutation, resetOtp]);

    const isProcessing = isLoadingCsrf || otpState.isProcessing || claimMutation.isPending;

    const getCurrentStep = () => {
        if (isLoadingCsrf) return 'csrf';
        return otpState.currentStep;
    };

    return {
        performBackgroundClaim,
        isProcessing,
        currentStep: getCurrentStep(),
        error: csrfError?.message || otpState.error || claimMutation.error?.message || null,
        reset: resetOtp,
    };
}
