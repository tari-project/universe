import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { useTrancheClaimSubmission } from '@app/hooks/airdrop/tranches/useTrancheClaimSubmission';
import { useClaimStatus } from '@app/hooks/airdrop/claim/useClaimStatus';
import { useSimpleClaimSubmission } from '@app/hooks/airdrop/claim/useSimpleClaimSubmission';
import { useAirdropStore } from '@app/store';
import { ClaimButton, ModalBody, ModalHeader, ModalTitle, ModalWrapper } from './MonthlyTrancheClaimModal.styles';
import { useCurrentMonthTranche } from '@app/hooks/airdrop/tranches/useTrancheStatus.ts';
import { useTrancheAutoRefresh } from '@app/hooks/airdrop/tranches/useTrancheAutoRefresh.ts';

interface CountdownTime {
    days: number;
    hours: number;
    minutes: number;
}
interface MonthlyTrancheClaimModalProps {
    showModal: boolean;
    onClose: () => void;
}

export function MonthlyTrancheClaimModal({ showModal, onClose }: MonthlyTrancheClaimModalProps) {
    const { t } = useTranslation('airdrop');
    const [isClaimingOptimistic, setIsClaimingOptimistic] = useState(false);
    const initialCountdownRef = useRef(false);
    const [countdown, setCountdown] = useState<CountdownTime | null>(null);

    const { currentTranche } = useCurrentMonthTranche();
    const {
        submitTrancheClaimWithOtp,
        isLoading: trancheLoading,
        canClaim: trancheCanClaim,
        otpState: _otpState,
    } = useTrancheClaimSubmission();

    // Legacy claim system hooks (fallback)
    const { data: claimStatus, isLoading: _claimStatusLoading } = useClaimStatus();
    const { performClaim, isProcessing: legacyProcessing, error: _legacyError } = useSimpleClaimSubmission();

    // Auto-refresh tranche data while modal is open
    const { refreshTranches } = useTrancheAutoRefresh({
        enabled: showModal,
        notifyOnNewTranches: false, // Don't show notifications in modal
    });

    const claim = useAirdropStore((state) => state.claim);

    // Get tranche data for display decisions
    const trancheStatus = useAirdropStore((state) => state.trancheStatus);

    // Determine which system to use and data to display

    const hasFutureTranche = trancheStatus?.tranches.some((t) => !t.claimed && new Date(t.validFrom) > new Date());
    const futureTranche = trancheStatus?.tranches.find((t) => !t.claimed && new Date(t.validFrom) > new Date());
    const lastClaimedTranche = trancheStatus?.tranches.find((t) => t.claimed);

    const hasAnyClaimData = !!trancheStatus;

    // Handle claim submission
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

    const getCountdownParts = useCallback(() => {
        const tranche = currentTranche || futureTranche;
        if (!tranche) return null;
        const now = new Date().getTime();
        const validUntil = new Date(tranche.validTo).getTime();
        const validFrom = new Date(tranche.validFrom).getTime();

        const futureTime = currentTranche && validUntil ? validUntil : validFrom;
        const timeDiff = futureTime - now;

        if (timeDiff <= 0) {
            setCountdown(null);
            console.debug('Future tranche should now be available, refreshing data');
            void refreshTranches(); // Refresh to get updated data
            return;
        }

        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        return { days, hours, minutes };
    }, [currentTranche, futureTranche, refreshTranches]);

    const updateCountdown = useCallback(() => {
        const parts = getCountdownParts();
        if (parts) {
            const { days, hours, minutes } = parts || {};
            setCountdown({ days, hours, minutes });
            initialCountdownRef.current = true;
        }
    }, [getCountdownParts]);

    useEffect(() => {
        if (countdown || initialCountdownRef.current) return;
        updateCountdown();
    }, [countdown, updateCountdown]);

    // Countdown effect for future tranches
    useEffect(() => {
        const interval = setInterval(updateCountdown, 1000 * 55);

        return () => clearInterval(interval);
    }, [updateCountdown]);

    // Update messaging based on tranche availability
    const displayTitle = t('tranche.claim-modal.title', {
        context: !currentTranche && hasFutureTranche ? 'future' : '',
    });

    const isAnyLoading = trancheLoading || legacyProcessing || isClaimingOptimistic || claim?.isClaimInProgress;
    const canClaimNow = trancheCanClaim && claimStatus?.hasClaim;

    const claimMarkup = (
        <ClaimButton onClick={handleClaim} disabled={!canClaimNow || isAnyLoading}>
            {!isAnyLoading ? t('tranche.claim-modal.claim-button') : t('tranche.claim-modal.claiming')}
        </ClaimButton>
    );

    const displayDescription = t('tranche.claim-modal.description', { emojis: `💜🐢` });

    if (!hasAnyClaimData) {
        return null;
    }
    return (
        <Dialog open={showModal} onOpenChange={onClose}>
            <DialogContent variant="wrapper">
                <ModalWrapper initial={{ opacity: 0, y: '100px' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <ModalHeader>
                        <ModalTitle variant="h2">{displayTitle}</ModalTitle>
                    </ModalHeader>
                    <ModalBody>{displayDescription}</ModalBody>

                    {claimMarkup}
                </ModalWrapper>
            </DialogContent>
        </Dialog>
    );
}
