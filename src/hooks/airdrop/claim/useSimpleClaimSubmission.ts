import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest';
import { useWalletStore } from '@app/store';
import { addToast } from '@app/components/ToastStack/useToastStore';
import { useCsrfToken } from './useCsrfToken';
import type {
    ClaimRequest,
    ClaimResult,
    BackgroundClaimResult,
    OtpResponse,
    OtpErrorResponse,
} from '@app/types/airdrop-claim';

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

type ClaimStep = 'csrf' | 'otp-request' | 'otp-wait' | 'claim-submit' | 'complete' | 'error';

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
        usdtAmount: response.data.usdtAmount,
        claimId: response.data.claimId,
        trackingId: response.data.trackingId,
    };
}

async function waitForWebSocketOTP(csrfToken: string, walletAddress: string): Promise<string> {
    return new Promise((resolve, reject) => {
        let unlisten: (() => void) | null = null;
        let timeoutId: NodeJS.Timeout | null = null;

        const cleanup = () => {
            if (unlisten) {
                unlisten();
                unlisten = null;
            }
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        };

        const setupListenerAndSendRequest = async () => {
            try {
                // Set up WebSocket listener for OTP response
                unlisten = await listen('ws-rx', (event: any) => {
                    try {
                        const payload = event.payload;
                        let data: OtpResponse | OtpErrorResponse;

                        // Handle both string and object data
                        if (typeof payload?.data === 'string') {
                            data = JSON.parse(payload.data);
                        } else {
                            data = payload?.data;
                        }

                        switch (payload.event) {
                            case 'otp-response': {
                                const otpResponse = data as OtpResponse;
                                console.info('OTP received via WebSocket:', otpResponse.otp);
                                cleanup();
                                resolve(otpResponse.otp);
                                break;
                            }
                            case 'otp-error': {
                                const errorResponse = data as OtpErrorResponse;
                                console.error('OTP request failed:', errorResponse.error);
                                addToast({
                                    title: 'Verification Failed',
                                    text: errorResponse.error,
                                    type: 'error',
                                    timeout: 5000,
                                });
                                cleanup();
                                reject(new Error(errorResponse.error));
                                break;
                            }
                        }
                    } catch (error) {
                        console.error('Failed to parse WebSocket message:', error);
                        cleanup();
                        reject(new Error('Failed to parse OTP response'));
                    }
                });

                // Set timeout for OTP request (3 minutes)
                timeoutId = setTimeout(
                    () => {
                        cleanup();
                        reject(new Error('OTP request timed out'));
                    },
                    3 * 60 * 1000
                );

                // Send OTP request via Tauri command
                await invoke('send_otp_request', {
                    csrfToken,
                    walletAddress,
                });
            } catch (error) {
                cleanup();
                reject(new Error(`Failed to send OTP request: ${error}`));
            }
        };

        // Start the async operations
        setupListenerAndSendRequest();
    });
}

export function useSimpleClaimSubmission() {
    const walletAddress = useWalletStore((s) => s.tari_address_base58);
    const { data: csrfData, isLoading: isLoadingCsrf, error: csrfError } = useCsrfToken();
    const [currentStep, setCurrentStep] = useState<ClaimStep>('csrf');
    const [error, setError] = useState<string | null>(null);

    const claimMutation = useMutation({
        mutationFn: submitClaim,
        onSuccess: (result) => {
            addToast({
                title: 'Airdrop Claimed Successfully!',
                text: `Amount: ${result.amount} XTM • Transaction ID: ${result.transactionId}`,
                type: 'success',
                timeout: 10000,
            });
            setCurrentStep('complete');
        },
        onError: (error: Error) => {
            addToast({
                title: 'Claim Failed',
                text: error.message,
                type: 'error',
                timeout: 8000,
            });
            setCurrentStep('error');
            setError(error.message);
        },
    });

    const performClaim = useCallback(
        async (claimTarget: 'xtm' | 'usd' = 'xtm'): Promise<BackgroundClaimResult> => {
            try {
                setError(null);

                if (!walletAddress) {
                    throw new Error('Wallet address not available');
                }

                // Step 1: Get CSRF token (if not already loaded)
                setCurrentStep('csrf');
                addToast({
                    title: 'Starting Claim Process',
                    text: 'Retrieving security token...',
                    type: 'info',
                    timeout: 3000,
                });

                if (!csrfData?.csrfToken) {
                    if (csrfError) {
                        throw new Error('Failed to get CSRF token');
                    }
                    if (isLoadingCsrf) {
                        throw new Error('CSRF token still loading');
                    }
                    throw new Error('CSRF token not available');
                }

                addToast({
                    title: 'Security Token Retrieved',
                    text: 'Requesting verification code...',
                    type: 'success',
                    timeout: 3000,
                });

                // Step 2: Request OTP and wait for WebSocket response
                setCurrentStep('otp-request');
                addToast({
                    title: 'Requesting Verification',
                    text: 'Waiting for verification code via secure channel...',
                    type: 'info',
                    timeout: 5000,
                });

                const otp = await waitForWebSocketOTP(csrfData.csrfToken, walletAddress);

                addToast({
                    title: 'Verification Code Received',
                    text: 'Submitting your claim...',
                    type: 'success',
                    timeout: 3000,
                });

                // Step 3: Submit claim with OTP
                setCurrentStep('claim-submit');
                const claimRequest: ClaimRequest = {
                    claimTarget,
                    walletAddress,
                    csrfToken: csrfData.csrfToken,
                    otp,
                };

                const result = await submitClaim(claimRequest);
                setCurrentStep('complete');

                return {
                    success: true,
                    transactionId: result.transactionId,
                    amount: result.amount,
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                setCurrentStep('error');
                setError(errorMessage);

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
        [walletAddress, csrfData, csrfError, isLoadingCsrf]
    );

    const reset = useCallback(() => {
        setCurrentStep('csrf');
        setError(null);
    }, []);

    const isProcessing =
        isLoadingCsrf ||
        claimMutation.isPending ||
        (currentStep !== 'csrf' && currentStep !== 'complete' && currentStep !== 'error');

    return {
        performClaim,
        isProcessing,
        currentStep,
        error: error || csrfError?.message || claimMutation.error?.message || null,
        reset,
    };
}
