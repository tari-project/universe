import { useCallback, useEffect, useRef } from 'react';
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
        claimTarget: 'xtm';
        transactionId: string;
        amount: number;
        claimId: string;
        trackingId: string;
        trancheId?: string;
    };
    error?: string;
}

async function submitClaim(claimRequest: ClaimRequest): Promise<ClaimResult> {
    const response = await handleAirdropRequest<ClaimSubmissionResponse>({
        path: '/tari/claim-airdrop',
        method: 'POST',
        body: claimRequest as unknown as Record<string, unknown>,
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
        claimId: response.data.claimId,
        trackingId: response.data.trackingId,
        trancheId: response.data.trancheId,
    };
}

export function useBackgroundClaimSubmission() {
    const walletAddress = useWalletStore((s) => s.tari_address_base58);
    const { data: csrfData, isLoading: isLoadingCsrf, error: csrfError } = useCsrfToken();
    const { requestOtp, otpData, state: otpState, reset: resetOtp } = useAutomaticOtpClaim();

    // Refs for promise resolution
    const pendingClaimRef = useRef<{
        resolve: (value: BackgroundClaimResult) => void;
        reject: (reason: Error) => void;
        claimTarget: 'xtm';
        csrfToken: string;
        trancheId?: string;
    } | null>(null);

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

    // Effect to watch for OTP data and submit claim automatically
    useEffect(() => {
        if (otpData?.otp && pendingClaimRef.current && walletAddress && !claimMutation.isPending) {
            const pendingClaim = pendingClaimRef.current;
            const { claimTarget, csrfToken, trancheId } = pendingClaim;

            console.log('OTP received, submitting claim with OTP:', otpData.otp);

            // Clear the pending claim immediately to prevent multiple submissions
            pendingClaimRef.current = null;

            const claimRequest: ClaimRequest = {
                claimTarget,
                walletAddress,
                csrfToken,
                otp: otpData.otp,
                ...(trancheId && { trancheId }),
            };

            claimMutation.mutate(claimRequest, {
                onSuccess: (result) => {
                    pendingClaim.resolve({
                        success: true,
                        transactionId: result.transactionId,
                        amount: result.amount,
                    });
                },
                onError: (error: Error) => {
                    pendingClaim.reject(error);
                },
            });
        }
    }, [otpData?.otp, walletAddress]);

    // Effect to handle OTP errors
    useEffect(() => {
        if (otpState.currentStep === 'error' && pendingClaimRef.current) {
            pendingClaimRef.current.reject(new Error(otpState.error || 'OTP request failed'));
            pendingClaimRef.current = null;
        }
    }, [otpState.currentStep, otpState.error]);

    const performBackgroundClaim = useCallback(
        async (claimTarget: 'xtm' = 'xtm', trancheId?: string): Promise<BackgroundClaimResult> => {
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

                // Clear any existing pending claim and reset OTP state
                pendingClaimRef.current = null;
                resetOtp();

                // Step 2: Request OTP
                await requestOtp(csrfData.csrfToken);

                // Set up promise for claim completion
                return new Promise((resolve, reject) => {
                    // Store the promise resolvers for the effects to use
                    pendingClaimRef.current = {
                        resolve,
                        reject,
                        claimTarget,
                        csrfToken: csrfData.csrfToken,
                        trancheId,
                    };

                    // Set up timeout (3 minutes to match OTP timeout)
                    const timeoutId = setTimeout(
                        () => {
                            if (pendingClaimRef.current) {
                                pendingClaimRef.current.reject(new Error('OTP wait timeout'));
                                pendingClaimRef.current = null;
                            }
                        },
                        3 * 60 * 1000
                    );

                    // Clean up timeout when promise resolves/rejects
                    const originalResolve = resolve;
                    const originalReject = reject;

                    pendingClaimRef.current.resolve = (value) => {
                        clearTimeout(timeoutId);
                        originalResolve(value);
                    };

                    pendingClaimRef.current.reject = (reason) => {
                        clearTimeout(timeoutId);
                        originalReject(reason);
                    };
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
        },
        [walletAddress, csrfData, csrfError, isLoadingCsrf, requestOtp, resetOtp]
    );

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
