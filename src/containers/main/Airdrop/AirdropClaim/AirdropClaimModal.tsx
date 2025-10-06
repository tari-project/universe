import { useState, useEffect } from 'react';
import GreenModal from '@app/components/GreenModal/GreenModal.tsx';
import { useSimpleClaimSubmission } from '@app/hooks/airdrop/claim/useSimpleClaimSubmission';
import { useClaimStatus } from '@app/hooks/airdrop/claim/useClaimStatus';
import { useAirdropStore } from '@app/store';
import { setClaimInProgress, setClaimResult } from '@app/store/actions/airdropStoreActions';
import {
    ModalWrapper,
    ModalTitle,
    LoadingContainer,
    LoadingSpinner,
    LoadingText,
    ErrorContainer,
    ErrorTitle,
    ErrorText,
    EmptyStateContainer,
    EmptyStateIcon,
    EmptyStateTitle,
    EmptyStateText,
    ContentContainer,
    ClaimStatusCard,
    ClaimStatusTitle,
    ClaimStatusDetails,
    ClaimStatusRow,
    ClaimStatusLabel,
    ClaimStatusValue,
    TargetSelectionContainer,
    TargetSelectionLabel,
    TargetOptions,
    TargetOption,
    TargetRadio,
    TargetContent,
    TargetTitle,
    TargetAmount,
    ProgressContainer,
    ProgressHeader,
    ProgressTitle,
    ProgressCounter,
    ProgressBar,
    ProgressFill,
    ProgressText,
    ClaimButton,
    ButtonContent,
    ButtonSpinner,
    HowItWorksContainer,
    HowItWorksTitle,
    HowItWorksList,
    HowItWorksNote,
} from './styles';

export default function AirdropClaimModal() {
    const [selectedTarget, setSelectedTarget] = useState<'xtm' | 'usd'>('xtm');
    const claimState = useAirdropStore((state) => state.claim);
    const isLoggedIn = useAirdropStore((state) => state.userDetails?.user?.id);
    const { performClaim, isProcessing, currentStep, error } = useSimpleClaimSubmission();
    const { data: claimStatus, isLoading: isLoadingStatus } = useClaimStatus();

    const [showModal, setShowModal] = useState(true);

    const onClose = () => {
        console.log('onClose');
    };

    const handleClaim = async () => {
        if (!claimStatus?.hasClaim || isProcessing) {
            return;
        }

        setClaimInProgress(true);

        try {
            const result = await performClaim(selectedTarget);
            setClaimResult(result);

            // Close modal on success after a brief delay to show success state
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
        }
    };

    const getStepProgress = () => {
        const steps = ['csrf', 'otp-request', 'otp-wait', 'claim-submit', 'complete'];
        const currentIndex = steps.indexOf(currentStep);
        return Math.max(0, currentIndex + 1);
    };

    const getStepText = () => {
        switch (currentStep) {
            case 'csrf':
                return 'Getting security token...';
            case 'otp-request':
                return 'Requesting verification...';
            case 'otp-wait':
                return 'Waiting for verification...';
            case 'claim-submit':
                return 'Submitting claim...';
            case 'complete':
                return 'Claim successful!';
            default:
                return 'Ready to claim';
        }
    };

    const isDisabled = isProcessing || isLoadingStatus || !claimStatus?.hasClaim;

    // Reset selected target when modal opens and there's claim data
    useEffect(() => {
        if (showModal && claimStatus?.claimTarget) {
            setSelectedTarget(claimStatus.claimTarget);
        }
    }, [showModal, claimStatus?.claimTarget]);

    return (
        <GreenModal showModal={!!isLoggedIn} onClose={onClose} padding={24}>
            <ModalWrapper>
                <ModalTitle>{'Airdrop Claim'}</ModalTitle>

                {isLoadingStatus ? (
                    <LoadingContainer>
                        <LoadingSpinner />
                        <LoadingText>{'Checking claim status...'}</LoadingText>
                    </LoadingContainer>
                ) : error ? (
                    <ErrorContainer>
                        <ErrorTitle>{'Error'}</ErrorTitle>
                        <ErrorText>{error}</ErrorText>
                    </ErrorContainer>
                ) : !claimStatus?.hasClaim ? (
                    <EmptyStateContainer>
                        <EmptyStateIcon>{'💎'}</EmptyStateIcon>
                        <EmptyStateTitle>{'No Claims Available'}</EmptyStateTitle>
                        <EmptyStateText>
                            {'Continue mining to earn airdrop rewards. Claims will appear here when available.'}
                        </EmptyStateText>
                    </EmptyStateContainer>
                ) : (
                    <ContentContainer>
                        {/* Claim Status */}
                        <ClaimStatusCard>
                            <ClaimStatusTitle>{'Claim Available!'}</ClaimStatusTitle>
                            <ClaimStatusDetails>
                                <ClaimStatusRow>
                                    <ClaimStatusLabel>{'Amount:'}</ClaimStatusLabel>
                                    <ClaimStatusValue>
                                        {claimStatus.amount}
                                        {' XTM'}
                                    </ClaimStatusValue>
                                </ClaimStatusRow>
                                <ClaimStatusRow>
                                    <ClaimStatusLabel>{'USD Value:'}</ClaimStatusLabel>
                                    <ClaimStatusValue>
                                        {'$'}
                                        {claimStatus.usdtAmount}
                                    </ClaimStatusValue>
                                </ClaimStatusRow>
                                <ClaimStatusRow>
                                    <ClaimStatusLabel>{'Available Since:'}</ClaimStatusLabel>
                                    <ClaimStatusValue>
                                        {new Date(claimStatus.claimDate).toLocaleDateString()}
                                    </ClaimStatusValue>
                                </ClaimStatusRow>
                            </ClaimStatusDetails>
                        </ClaimStatusCard>

                        {/* Target Selection */}
                        <TargetSelectionContainer>
                            <TargetSelectionLabel>{'Choose Claim Type:'}</TargetSelectionLabel>
                            <TargetOptions>
                                <TargetOption $disabled={isProcessing}>
                                    <TargetRadio
                                        type="radio"
                                        name="claimTarget"
                                        value="xtm"
                                        checked={selectedTarget === 'xtm'}
                                        onChange={(e) => setSelectedTarget(e.target.value as 'xtm')}
                                        disabled={isProcessing}
                                    />
                                    <TargetContent>
                                        <TargetTitle>{'Tari (XTM)'}</TargetTitle>
                                        <TargetAmount>
                                            {Number(claimStatus.amount)}
                                            {' XTM'}
                                        </TargetAmount>
                                    </TargetContent>
                                </TargetOption>
                                <TargetOption $disabled={isProcessing}>
                                    <TargetRadio
                                        type="radio"
                                        name="claimTarget"
                                        value="usd"
                                        checked={selectedTarget === 'usd'}
                                        onChange={(e) => setSelectedTarget(e.target.value as 'usd')}
                                        disabled={isProcessing}
                                    />
                                    <TargetContent>
                                        <TargetTitle>{'USDT (Stablecoin)'}</TargetTitle>
                                        <TargetAmount>
                                            {'$'}
                                            {Number(claimStatus.usdtAmount).toFixed(2)}
                                            {' USDT'}
                                        </TargetAmount>
                                    </TargetContent>
                                </TargetOption>
                            </TargetOptions>
                        </TargetSelectionContainer>

                        {/* Progress Indicator */}
                        {isProcessing && (
                            <ProgressContainer>
                                <ProgressHeader>
                                    <ProgressTitle>{'Processing Claim'}</ProgressTitle>
                                    <ProgressCounter>
                                        {getStepProgress()}
                                        {'/'}
                                        {5}
                                    </ProgressCounter>
                                </ProgressHeader>
                                <ProgressBar>
                                    <ProgressFill $progress={(getStepProgress() / 5) * 100} />
                                </ProgressBar>
                                <ProgressText>{getStepText()}</ProgressText>
                            </ProgressContainer>
                        )}

                        {/* Claim Button */}
                        <ClaimButton onClick={handleClaim} $disabled={isDisabled} $processing={isProcessing}>
                            <ButtonContent>
                                {isProcessing && <ButtonSpinner />}
                                <span>
                                    {isProcessing
                                        ? 'Processing...'
                                        : `Claim ${selectedTarget === 'xtm' ? `${claimStatus.amount} XTM` : `$${claimStatus.usdtAmount} USDT`}`}
                                </span>
                            </ButtonContent>
                        </ClaimButton>

                        {/* How it works */}
                        <HowItWorksContainer>
                            <HowItWorksTitle>{'How it works:'}</HowItWorksTitle>
                            <HowItWorksList>
                                <li>{'Security tokens are fetched automatically'}</li>
                                <li>{'Verification is handled in the background'}</li>
                                <li>{'Your claim is submitted securely'}</li>
                                <li>{"You'll see a confirmation when complete"}</li>
                            </HowItWorksList>
                            <HowItWorksNote>{'Entire process takes 10-30 seconds'}</HowItWorksNote>
                        </HowItWorksContainer>
                    </ContentContainer>
                )}
            </ModalWrapper>
        </GreenModal>
    );
}
