import { useCallback, useEffect, useRef, useState } from 'react';
import { useAirdropStore, useWalletStore } from '@app/store';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { OtpResponse, OtpErrorResponse, AutomaticClaimState } from '@app/types/airdrop-claim';

// interface OtpWebSocketResponse {
//     event: string;
//     data: OtpResponse | OtpErrorResponse;
// }

export function useAutomaticOtpClaim() {
    const [state, setState] = useState<AutomaticClaimState>({
        isProcessing: false,
        currentStep: 'csrf',
        error: null,
    });

    const [otpData, setOtpData] = useState<OtpResponse | null>(null);
    const unlistenRef = useRef<(() => void) | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const walletAddress = useWalletStore((s) => s.tari_address_base58);
    const airdropToken = useAirdropStore((state) => state.airdropTokens?.token);

    const cleanup = useCallback(() => {
        if (unlistenRef.current) {
            unlistenRef.current();
            unlistenRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const handleWebSocketMessage = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (event: any) => {
            try {
                const payload = event.payload;
                // Handle both string and object data
                let data: OtpResponse | OtpErrorResponse;
                if (typeof payload?.data === 'string') {
                    data = JSON.parse(payload.data) as OtpResponse | OtpErrorResponse;
                } else {
                    data = payload?.data as OtpResponse | OtpErrorResponse;
                }

                switch (payload.event) {
                    case 'otp-response': {
                        const otpResponse = data as OtpResponse;
                        console.info('OTP received:', otpResponse.otp, 'Expires:', otpResponse.expiresAt);
                        setOtpData(otpResponse);
                        setState((prev) => ({
                            ...prev,
                            currentStep: 'claim-submit',
                            error: null,
                        }));
                        cleanup();
                        break;
                    }

                    case 'otp-error': {
                        const errorResponse = data as OtpErrorResponse;
                        console.error('OTP request failed:', errorResponse.error);
                        setState((prev) => ({
                            ...prev,
                            currentStep: 'error',
                            error: errorResponse.error,
                            isProcessing: false,
                        }));
                        cleanup();
                        break;
                    }

                    default:
                        // Ignore other events
                        break;
                }
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
                setState((prev) => ({
                    ...prev,
                    currentStep: 'error',
                    error: 'Failed to parse OTP response',
                    isProcessing: false,
                }));
                cleanup();
            }
        },
        [cleanup]
    );

    const requestOtp = useCallback(
        async (csrfToken: string): Promise<void> => {
            if (!walletAddress || !airdropToken) {
                throw new Error('Wallet address or airdrop token not available');
            }

            setState((prev) => ({
                ...prev,
                currentStep: 'otp-request',
                error: null,
            }));

            // Set up WebSocket listener for OTP response
            try {
                const unlisten = await listen('ws-rx', handleWebSocketMessage);
                unlistenRef.current = unlisten;
            } catch (error) {
                throw new Error('Failed to set up WebSocket listener');
            }

            // Set timeout for OTP request (3 minutes)
            timeoutRef.current = setTimeout(
                () => {
                    setState((prev) => ({
                        ...prev,
                        currentStep: 'error',
                        error: 'OTP request timed out',
                        isProcessing: false,
                    }));
                    cleanup();
                },
                3 * 60 * 1000
            );

            setState((prev) => ({ ...prev, currentStep: 'otp-wait' }));

            // Send OTP request via Tauri command
            try {
                await invoke('send_otp_request', {
                    csrfToken,
                    walletAddress,
                });
            } catch (error) {
                cleanup();
                throw new Error(`Failed to send OTP request: ${error}`);
            }
        },
        [walletAddress, airdropToken, handleWebSocketMessage, cleanup]
    );

    const reset = useCallback(() => {
        cleanup();
        setState({
            isProcessing: false,
            currentStep: 'csrf',
            error: null,
        });
        setOtpData(null);
    }, [cleanup]);

    // Cleanup on unmount
    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    return {
        state,
        otpData,
        requestOtp,
        reset,
        isProcessing: state.isProcessing,
        currentStep: state.currentStep,
        error: state.error,
    };
}
