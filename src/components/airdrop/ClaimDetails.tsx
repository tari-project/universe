import { Trans, useTranslation } from 'react-i18next';
import { ClaimContainer, ClaimItems, EyebrowText, RemainingBalance, TrancheAmount } from './ClaimDetails.styles.ts';
import { calculateRemainingBalance, formatAmount } from './helpers.ts';
import { useBalanceSummary } from '@app/hooks/airdrop/tranches/useTrancheStatus.ts';

interface ClaimDetailsProps {
    displayAmount: number;
    isFutureTranche?: boolean;
}
export default function ClaimDetails({ displayAmount, isFutureTranche = false }: ClaimDetailsProps) {
    const { t } = useTranslation('airdrop');

    const balanceSummary = useBalanceSummary();
    const remainingAmount = calculateRemainingBalance();
    const displayEyebrow = t('tranche.claim-modal.eyebrow', { context: isFutureTranche ? 'future' : '' });

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
    return (
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
    );
}
