import React from 'react';
import { useBackgroundClaimSubmission } from '@app/hooks/airdrop/claim/useBackgroundClaimSubmission';
import { useClaimStatus } from '@app/hooks/airdrop/claim/useClaimStatus';
import { useAirdropStore } from '@app/store';
import { setClaimInProgress, setClaimResult } from '@app/store/actions/airdropStoreActions';

interface AirdropClaimButtonProps {
    claimTarget?: 'xtm' | 'usd';
    className?: string;
    children?: React.ReactNode;
}

export const AirdropClaimButton: React.FC<AirdropClaimButtonProps> = ({
    claimTarget = 'xtm',
    className = '',
    children,
}) => {
    const claimState = useAirdropStore((state) => state.claim);
    const { performBackgroundClaim, isProcessing, currentStep, error } = useBackgroundClaimSubmission();
    const { data: claimStatus, isLoading: isLoadingStatus } = useClaimStatus();

    const handleClaim = async () => {
        if (!claimStatus?.hasClaim || isProcessing) {
            return;
        }

        setClaimInProgress(true);

        try {
            const result = await performBackgroundClaim(claimTarget);
            setClaimResult(result);
        } catch (error) {
            setClaimResult({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            });
        }
    };

    const getButtonText = () => {
        if (isProcessing) {
            switch (currentStep) {
                case 'csrf':
                    return 'Getting CSRF Token...';
                case 'otp-request':
                    return 'Requesting OTP...';
                case 'otp-wait':
                    return 'Waiting for OTP...';
                case 'claim-submit':
                    return 'Submitting Claim...';
                default:
                    return 'Processing...';
            }
        }

        if (isLoadingStatus) {
            return 'Checking Status...';
        }

        if (!claimStatus?.hasClaim) {
            return 'No Claims Available';
        }

        return children || `Claim ${claimStatus.amount} ${claimTarget.toUpperCase()}`;
    };

    const isDisabled = isProcessing || isLoadingStatus || !claimStatus?.hasClaim;

    return (
        <button
            onClick={handleClaim}
            disabled={isDisabled}
            className={`
                px-6 py-3 rounded-lg font-medium transition-all duration-200
                ${isDisabled 
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                }
                ${isProcessing ? 'animate-pulse' : ''}
                ${className}
            `}
            aria-label={String(getButtonText())}
        >
            <div className="flex items-center justify-center gap-2">
                {isProcessing && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>{getButtonText()}</span>
            </div>
        </button>
    );
};

export default AirdropClaimButton;
