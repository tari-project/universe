// Airdrop Claim Hooks - Automated Background OTP Processing
export { useCsrfToken, KEY_CSRF_TOKEN } from './useCsrfToken';
export { useClaimStatus, KEY_CLAIM_STATUS } from './useClaimStatus';
export { useAutomaticOtpClaim } from './useAutomaticOtpClaim';
export { useBackgroundClaimSubmission } from './useBackgroundClaimSubmission';

// Re-export types for convenience
export type {
    OtpRequest,
    OtpRequestMessage,
    OtpResponse,
    OtpErrorResponse,
    ClaimStatus,
    ClaimRequest,
    ClaimResult,
    CsrfTokenResponse,
    AutomaticClaimState,
    BackgroundClaimResult,
    AirdropClaimState,
} from '@app/types/airdrop-claim';
