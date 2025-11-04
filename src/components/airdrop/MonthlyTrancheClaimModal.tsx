import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { useCurrentMonthTranche, useBalanceSummary } from '@app/hooks/airdrop/tranches';
import { useTrancheClaimSubmission } from '@app/hooks/airdrop/tranches/useTrancheClaimSubmission';
import { useAirdropStore } from '@app/store';
import {
    ModalWrapper,
    ModalHeader,
    ModalTitle,
    ModalBody,
    ClaimContainer,
    EyebrowText,
    TrancheAmount,
    RemainingBalance,
    ClaimButton,
    CloseButton,
    LoadingSpinner,
} from './MonthlyTrancheClaimModal.styles';
import CloseIcon from '@app/components/GreenModal/icons/CloseIcon';

interface MonthlyTrancheClaimModalProps {
    showModal: boolean;
    onClose: () => void;
}

export function MonthlyTrancheClaimModal({ showModal, onClose }: MonthlyTrancheClaimModalProps) {
    const [isClaimingOptimistic, setIsClaimingOptimistic] = useState(false);
    const { currentTranche, hasCurrentTranche } = useCurrentMonthTranche();
    const balanceSummary = useBalanceSummary();
    const { submitTrancheClaimWithOtp, isLoading, canClaim, otpState } = useTrancheClaimSubmission();
    
    const claim = useAirdropStore((state) => state.claim);

    // Handle claim submission
    const handleClaim = async () => {
        if (!currentTranche || !canClaim) return;

        try {
            setIsClaimingOptimistic(true);
            await submitTrancheClaimWithOtp(currentTranche.id);
            // Modal should close automatically on success via toast or parent component
        } catch (error) {
            console.error('Claim failed:', error);
            setIsClaimingOptimistic(false);
        }
    };

    // Reset optimistic state when modal closes
    useEffect(() => {
        if (!showModal) {
            setIsClaimingOptimistic(false);
        }
    }, [showModal]);

    // Don't show modal if no current tranche available
    if (!hasCurrentTranche || !currentTranche) {
        return null;
    }

    const isAnyLoading = isLoading || isClaimingOptimistic || claim?.isClaimInProgress;
    const isOtpWaiting = otpState.currentStep === 'otp-wait';

    return (
        <Dialog open={showModal} onOpenChange={onClose}>
            <DialogContent variant="wrapper">
                <ModalWrapper
                    initial={{ opacity: 0, y: '100px' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                >
                    <CloseButton onClick={onClose}>
                        <CloseIcon />
                    </CloseButton>

                    <ModalHeader>
                        <ModalTitle>Claim this month's reward.</ModalTitle>
                    </ModalHeader>

                    <ModalBody>
                        Your hard work (and Yats!) has paid off! Each month on the 12th, you'll receive a portion of your airdrop.
                    </ModalBody>

                    <ClaimContainer>
                        <EyebrowText>This months' Airdrop reward</EyebrowText>
                        <TrancheAmount>{currentTranche.amount.toLocaleString()} XTM</TrancheAmount>
                        <RemainingBalance>
                            Your remaining allocation is {balanceSummary?.totalPending.toLocaleString() || '0'} XTM
                        </RemainingBalance>
                    </ClaimContainer>

                    <ClaimButton
                        onClick={handleClaim}
                        disabled={!canClaim || isAnyLoading}
                        $isLoading={isAnyLoading}
                    >
                        {isAnyLoading ? (
                            <>
                                <LoadingSpinner />
                                {isOtpWaiting ? 'Waiting for verification...' : 'Claiming...'}
                            </>
                        ) : (
                            'Claim'
                        )}
                    </ClaimButton>
                </ModalWrapper>
            </DialogContent>
        </Dialog>
    );
}
