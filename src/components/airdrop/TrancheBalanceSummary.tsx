import { useBalanceSummary } from '@app/hooks/airdrop/tranches';
import { useTranslation } from 'react-i18next';
import {
    SummaryContainer,
    SummaryTitle,
    BalanceGrid,
    BalanceItem,
    BalanceAmount,
    BalanceLabel,
    TotalSection,
    TotalAmount,
    TotalLabel,
    LoadingContainer,
    LoadingSpinner,
} from './TrancheBalanceSummary.styles';

interface TrancheBalanceSummaryProps {
    className?: string;
    showTitle?: boolean;
}

export function TrancheBalanceSummary({ className, showTitle = true }: TrancheBalanceSummaryProps) {
    const { t } = useTranslation('airdrop');
    const balanceSummary = useBalanceSummary();

    if (!balanceSummary) {
        return (
            <SummaryContainer className={className}>
                <LoadingContainer>
                    <LoadingSpinner />
                    <span>Loading balance...</span>
                </LoadingContainer>
            </SummaryContainer>
        );
    }

    return (
        <SummaryContainer className={className}>
            {showTitle && <SummaryTitle>{t('tranche.status.balance-summary')}</SummaryTitle>}

            <TotalSection>
                <TotalAmount>{balanceSummary.totalXtm.toLocaleString()} XTM</TotalAmount>
                <TotalLabel>{t('tranche.status.total-allocation')}</TotalLabel>
            </TotalSection>

            <BalanceGrid>
                <BalanceItem>
                    <BalanceAmount $type="claimed">{balanceSummary.totalClaimed.toLocaleString()}</BalanceAmount>
                    <BalanceLabel>{t('tranche.status.claimed')}</BalanceLabel>
                </BalanceItem>

                <BalanceItem>
                    <BalanceAmount $type="pending">{balanceSummary.totalPending.toLocaleString()}</BalanceAmount>
                    <BalanceLabel>{t('tranche.status.pending')}</BalanceLabel>
                </BalanceItem>

                {balanceSummary.totalExpired > 0 && (
                    <BalanceItem>
                        <BalanceAmount $type="expired">{balanceSummary.totalExpired.toLocaleString()}</BalanceAmount>
                        <BalanceLabel>{t('tranche.status.expired')}</BalanceLabel>
                    </BalanceItem>
                )}
            </BalanceGrid>
        </SummaryContainer>
    );
}
