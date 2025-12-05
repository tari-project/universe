import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { useTrancheClaimSubmission } from '@app/hooks/airdrop/tranches/useTrancheClaimSubmission';
import { useAirdropStore } from '@app/store';
import { ClaimButton, ModalBody, ModalHeader, ModalTitle, ModalWrapper } from './MonthlyTrancheClaimModal.styles';
import { useAvailableTranches } from '@app/hooks/airdrop/tranches/useTrancheStatus.ts';
import { useTrancheAutoRefresh } from '@app/hooks/airdrop/tranches/useTrancheAutoRefresh.ts';
import ClaimDetails from '@app/components/airdrop/ClaimDetails.tsx';
import Countdown from '@app/components/airdrop/Countdown.tsx';

interface MonthlyTrancheClaimModalProps {
    showModal: boolean;
    onClose: () => void;
}

export function MonthlyTrancheClaimModal({ showModal, onClose }: MonthlyTrancheClaimModalProps) {
    const { t } = useTranslation('airdrop');
    const [isClaimingOptimistic, setIsClaimingOptimistic] = useState(false);

    const claim = useAirdropStore((state) => state.claim);
    const trancheStatus = useAirdropStore((state) => state.trancheStatus);
    const { currentTranche, nextTranche, lastClaimedTranche } = useAvailableTranches();

    const {
        submitTrancheClaimWithOtp,
        isLoading: trancheLoading,
        canClaim: trancheCanClaim,
        otpState: _otpState,
    } = useTrancheClaimSubmission();

    const { refreshTranches } = useTrancheAutoRefresh({
        enabled: showModal,
        notifyOnNewTranches: false, // Don't show notifications in modal
    });

    const isFuture = !currentTranche && !!nextTranche;
    const isCurrentUnclaimed = Boolean(currentTranche && !currentTranche.claimed);
    const handleClaim = async () => {
        if (!currentTranche || !trancheCanClaim) return;
        try {
            setIsClaimingOptimistic(true);
            await submitTrancheClaimWithOtp(currentTranche.id);
            // Modal should close automatically on success via toast or parent component
        } catch (error) {
            console.error('Tranche claim failed:', error);
            setIsClaimingOptimistic(false);
        }
    };

    // Reset optimistic state when modal closes
    useEffect(() => {
        if (!showModal) {
            setIsClaimingOptimistic(false);
        }
    }, [showModal]);

    const displayTitle = t('tranche.claim-modal.title', { context: isFuture || !currentTranche ? 'future' : '' });
    const isAnyLoading = trancheLoading || isClaimingOptimistic || claim?.isClaimInProgress;
    const displayAmount = currentTranche?.amount || nextTranche?.amount || lastClaimedTranche?.amount;

    const displayDescription = t('tranche.claim-modal.description', { emojis: `💜🐢` });
    const countdownTime = isCurrentUnclaimed ? currentTranche?.validTo : undefined;

    if (!trancheStatus) {
        return null;
    }
    return (
        <Dialog open={showModal} onOpenChange={onClose}>
            <DialogContent variant="wrapper">
                <ModalWrapper initial={{ opacity: 0, y: '100px' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <ModalHeader>
                        <ModalTitle variant="h2">{displayTitle}</ModalTitle>
                    </ModalHeader>
                    {!isFuture ? <ModalBody>{displayDescription}</ModalBody> : null}
                    <ClaimDetails displayAmount={displayAmount} isFutureTranche={isFuture || !currentTranche} />
                    {!isFuture && !!currentTranche && (
                        <ClaimButton onClick={handleClaim} disabled={!trancheCanClaim || isAnyLoading}>
                            {!isAnyLoading ? t('tranche.claim-modal.claim-button') : t('tranche.claim-modal.claiming')}
                        </ClaimButton>
                    )}
                    {!isAnyLoading && (
                        <Countdown
                            isCurrent={isCurrentUnclaimed}
                            futureTime={countdownTime}
                            onEndReached={refreshTranches}
                        />
                    )}
                </ModalWrapper>
            </DialogContent>
        </Dialog>
    );
}
