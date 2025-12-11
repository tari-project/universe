import { Trans, useTranslation } from 'react-i18next';
import { ClaimContainer, ClaimItems, EyebrowText, RemainingBalance, TrancheAmount } from './ClaimDetails.styles.ts';
import { calculateRemainingBalance, formatAmount } from './helpers.ts';
import { useBalanceSummary } from '@app/hooks/airdrop/tranches/useTrancheStatus.ts';
import { useClaimStatus } from '@app/hooks/airdrop/claim/useClaimStatus.ts';

interface ClaimDetailsProps {
    displayAmount?: number | null;
}
export default function ClaimDetails({ displayAmount }: ClaimDetailsProps) {
    const { t } = useTranslation('airdrop');
    const { data: claimStatus } = useClaimStatus();
    const balanceSummary = useBalanceSummary();
    const remainingAmount = calculateRemainingBalance(balanceSummary, claimStatus?.amount);

    const displayEyebrow = t('tranche.claim-modal.eyebrow');

    const remainingMarkup = !!remainingAmount && (
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
    );
    return (
        <ClaimContainer>
            <EyebrowText>{displayEyebrow}</EyebrowText>
            <TrancheAmount>
                {formatAmount(displayAmount)} <span>XTM</span>
            </TrancheAmount>
            <ClaimItems>{remainingMarkup}</ClaimItems>
        </ClaimContainer>
    );
}
