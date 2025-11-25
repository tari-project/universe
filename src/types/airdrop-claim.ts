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
    claimTarget: 'xtm';
    amount: number;
    claimDate: string;
}

export interface ClaimRequest {
    claimTarget: 'xtm';
    walletAddress: string;
    csrfToken: string;
    otp: string;
    trancheId?: string;
}

export interface ClaimResult {
    success: boolean;
    transactionId?: string;
    amount?: number;
    claimId?: string;
    trackingId?: string;
    trancheId?: string;
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

// Tranche-related types
export interface Tranche {
    id: string;
    trancheNumber: number;
    amount: number;
    validFrom: string;
    validTo: string;
    claimed: boolean;
    claimedAt: string | null;
    canClaim: boolean;
}

export interface TrancheStatus {
    totalTranches: number;
    claimedCount: number;
    availableCount: number;
    nextAvailable: string | null;
    tranches: Tranche[];
}

export interface BalanceSummary {
    totalXtm: number;
    totalClaimed: number;
    totalPending: number;
    totalExpired: number;
}

export interface TrancheClaimRequest extends Omit<ClaimRequest, 'trancheId'> {
    trancheId: string;
}

export interface TrancheClaimResult extends ClaimResult {
    trancheId: string;
}
