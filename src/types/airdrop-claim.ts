export interface OtpRequest {
    csrfToken: string;
    appId: string;
    walletAddress: string;
    timestamp: number;
    nonce: string;
}

export interface OtpRequestMessage extends OtpRequest {
    signature: string;
    pubKey: string;
}

export interface OtpResponse {
    otp: string;
    expiresAt: number;
}

export interface OtpErrorResponse {
    error: string;
    code?: string;
    attemptsRemaining?: number;
}

export interface ClaimStatus {
    hasClaim: boolean;
    claimTarget: 'xtm' | 'usd';
    amount: number;
    usdtAmount: number;
    claimDate: string;
}

export interface ClaimRequest {
    claimTarget: 'xtm' | 'usd';
    walletAddress: string;
    csrfToken: string;
    otp: string;
}

export interface ClaimResult {
    success: boolean;
    transactionId?: string;
    amount?: number;
    usdtAmount?: number;
    claimId?: string;
    trackingId?: string;
    error?: string;
}

export interface CsrfTokenResponse {
    success: boolean;
    csrfToken: string;
}

export interface AutomaticClaimState {
    isProcessing: boolean;
    currentStep: 'csrf' | 'otp-request' | 'otp-wait' | 'claim-submit' | 'complete' | 'error';
    error: string | null;
}

export interface BackgroundClaimResult {
    success: boolean;
    transactionId?: string;
    amount?: number;
    error?: string;
}

export interface AirdropClaimState {
    isClaimInProgress: boolean;
    lastClaimResult: BackgroundClaimResult | null;
    lastClaimTimestamp: number | null;
}
