import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { useTrancheClaimSubmission } from '@app/hooks/airdrop/tranches/useTrancheClaimSubmission';
import { useClaimStatus } from '@app/hooks/airdrop/claim/useClaimStatus';
import { useSimpleClaimSubmission } from '@app/hooks/airdrop/claim/useSimpleClaimSubmission';
import { useAirdropStore } from '@app/store';
import { setClaimInProgress, setClaimResult } from '@app/store/actions/airdropStoreActions';
import {
    ClaimButton,
    ClaimContainer,
    ClaimItems,
    CountdownContainer,
    CountdownSquare,
    CountdownWrapper,
    EyebrowText,
    ModalBody,
    ModalHeader,
    ModalTitle,
    ModalWrapper,
    RemainingBalance,
    TrancheAmount,
} from './MonthlyTrancheClaimModal.styles';
import { useBalanceSummary, useCurrentMonthTranche } from '@app/hooks/airdrop/tranches/useTrancheStatus.ts';
import { useTrancheAutoRefresh } from '@app/hooks/airdrop/tranches/useTrancheAutoRefresh.ts';
import { formatNumber, FormatPreset } from '@app/utils';

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
    const { t } = useTranslation('airdrop', { useSuspense: false });
    const [isClaimingOptimistic, setIsClaimingOptimistic] = useState(false);
    const initialCountdownRef = useRef(false);
    const [countdown, setCountdown] = useState<CountdownTime | null>(null);

    const { currentTranche, hasCurrentTranche } = useCurrentMonthTranche();
    const balanceSummary = useBalanceSummary();
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
    const isTrancheMode = hasCurrentTranche;
    const isLegacyMode = !isTrancheMode && claimStatus?.hasClaim;
    const hasFutureTranche = trancheStatus?.tranches.some((t) => !t.claimed && new Date(t.validFrom) > new Date());
    const lastClaimedTranche = trancheStatus?.tranches.find((t) => t.claimed);
    const futureTranche = trancheStatus?.tranches.find((t) => !t.claimed && new Date(t.validFrom) > new Date());

    // Always use tranche-style display, but functionality depends on data availability
    const hasAnyClaimData = isTrancheMode || isLegacyMode || trancheStatus;

    // Handle claim submission
    const handleClaim = async () => {
        if (isTrancheMode) {
            if (!currentTranche || !trancheCanClaim) return;

            try {
                setIsClaimingOptimistic(true);
                await submitTrancheClaimWithOtp(currentTranche.id);
                // Modal should close automatically on success via toast or parent component
            } catch (error) {
                console.error('Tranche claim failed:', error);
                setIsClaimingOptimistic(false);
            }
        } else if (isLegacyMode) {
            if (!claimStatus?.hasClaim || legacyProcessing) return;

            setClaimInProgress(true);

            try {
                const result = await performClaim('xtm');
                setClaimResult(result);

                // Close modal on success after a brief delay
                if (result.success) {
                    setTimeout(() => {
                        onClose();
                    }, 2000);
                }
            } catch (error) {
                setClaimResult({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error occurred',
                });
                setIsClaimingOptimistic(false);
            }
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

    // Determine what to display based on availability
    const displayAmount = isTrancheMode
        ? currentTranche?.amount
        : hasFutureTranche
          ? futureTranche?.amount
          : lastClaimedTranche?.amount || claimStatus?.amount;

    // Update messaging based on tranche availability
    const displayTitle = isTrancheMode
        ? t('tranche.claim-modal.title', { context: !currentTranche && hasFutureTranche ? 'future' : '' })
        : 'Your airdrop status';

    const displayDescription = isTrancheMode
        ? t('tranche.claim-modal.description', { emojis: `💜🐢` })
        : !currentTranche && hasFutureTranche
          ? 'Your next tranche will be available soon!'
          : "Here's your airdrop progress and claimed rewards.";

    const displayEyebrow = isTrancheMode
        ? t('tranche.claim-modal.eyebrow', { context: !currentTranche && hasFutureTranche ? 'future' : '' })
        : lastClaimedTranche
          ? 'Last claimed reward'
          : 'Your Airdrop reward';

    // Calculate remaining balance: total from claimStatus minus claimed and expired tranches
    const calculateRemainingBalance = () => {
        if (!claimStatus?.amount) return null;

        const totalOriginalAmount = claimStatus.amount;

        // Always try to subtract claimed and expired if we have tranche data
        if (balanceSummary) {
            const claimedAndExpired = balanceSummary.totalClaimed + balanceSummary.totalExpired;

            return totalOriginalAmount - claimedAndExpired;
        }

        // Fallback: show original amount if no tranche data
        console.debug('No balance summary, returning original amount');
        return totalOriginalAmount;
    };

    // Helper function to format numbers with proper rounding
    const formatAmount = (amount: number | undefined | null): string => {
        if (amount === undefined || amount === null) return '0';

        // Round to 2 decimals if needed, otherwise show as integer
        const rounded = Math.round(amount * 100) / 100;

        return formatNumber(rounded * 1_000_000, FormatPreset.XTM_LONG);
    };

    const remainingAmount = calculateRemainingBalance();

    const isAnyLoading = trancheLoading || legacyProcessing || isClaimingOptimistic || claim?.isClaimInProgress;
    const isOtpWaiting = isTrancheMode ? false : false; // OTP handling is now internal to performBackgroundClaim
    const canClaimNow = isTrancheMode ? trancheCanClaim : claimStatus?.hasClaim && !legacyProcessing;

    const claimedMarkup =
        balanceSummary && balanceSummary.totalClaimed > 0 ? (
            <RemainingBalance>
                {t('tranche.status.total-claimed')}: <span>{formatAmount(balanceSummary.totalClaimed)} XTM</span>
            </RemainingBalance>
        ) : null;
    const remainingMarkup =
        remainingAmount !== null ? (
            <RemainingBalance>
                <Trans
                    ns="airdrop"
                    i18nKey={'tranche.claim-modal.remaining-allocation'}
                    values={{
                        amount: formatAmount(remainingAmount),
                    }}
                    components={{ span: <span /> }}
                />
            </RemainingBalance>
        ) : null;

    const countdownMarkup = useMemo(() => {
        if (!countdown) return null;
        const isCurrent = !currentTranche;

        return (
            <CountdownWrapper>
                <ModalBody>
                    {isCurrent ? t('tranche.status.closes-prefix') : t('tranche.status.available-in')}
                </ModalBody>
                <CountdownContainer>
                    {countdown.days > 0 && <CountdownSquare>{countdown.days}D</CountdownSquare>}
                    {(countdown.days > 0 || countdown.hours > 0) && (
                        <CountdownSquare>{countdown.hours}H</CountdownSquare>
                    )}
                    <CountdownSquare>{countdown.minutes}M</CountdownSquare>
                </CountdownContainer>
                {isCurrent && <ModalBody>{t('tranche.status.closes-suffix')}</ModalBody>}
            </CountdownWrapper>
        );
    }, [countdown, currentTranche, t]);
    // Don't show modal if no claim data available at all
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

                    <ClaimContainer>
                        <EyebrowText>{displayEyebrow}</EyebrowText>
                        <TrancheAmount>
                            {formatAmount(displayAmount)} <span>XTM</span>
                        </TrancheAmount>
                        <ClaimItems>
                            {claimedMarkup}
                            {remainingMarkup}
                        </ClaimItems>
                    </ClaimContainer>

                    {isTrancheMode ? (
                        <>
                            {countdownMarkup}
                            <ClaimButton onClick={handleClaim} disabled={!canClaimNow || isAnyLoading}>
                                {!isAnyLoading
                                    ? t('tranche.claim-modal.claim-button')
                                    : isOtpWaiting
                                      ? t('tranche.claim-modal.waiting-verification')
                                      : t('tranche.claim-modal.claiming')}
                            </ClaimButton>
                        </>
                    ) : hasFutureTranche ? (
                        countdownMarkup
                    ) : (
                        <ClaimButton disabled={true} $isLoading={false}>
                            {t('tranche.status.no-active-claims')}
                        </ClaimButton>
                    )}
                </ModalWrapper>
            </DialogContent>
        </Dialog>
    );
}
