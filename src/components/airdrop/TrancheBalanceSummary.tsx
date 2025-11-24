import { useBalanceSummary } from '@app/hooks/airdrop/tranches';
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
            {showTitle && <SummaryTitle>{`XTM Balance Summary`}</SummaryTitle>}

            <TotalSection>
                <TotalAmount>{balanceSummary.totalXtm.toLocaleString()} XTM</TotalAmount>
                <TotalLabel>{`Total Allocation`}</TotalLabel>
            </TotalSection>

            <BalanceGrid>
                <BalanceItem>
                    <BalanceAmount $type="claimed">{balanceSummary.totalClaimed.toLocaleString()}</BalanceAmount>
                    <BalanceLabel>{`Claimed`}</BalanceLabel>
                </BalanceItem>

                <BalanceItem>
                    <BalanceAmount $type="pending">{balanceSummary.totalPending.toLocaleString()}</BalanceAmount>
                    <BalanceLabel>{`Pending`}</BalanceLabel>
                </BalanceItem>

                {balanceSummary.totalExpired > 0 && (
                    <BalanceItem>
                        <BalanceAmount $type="expired">{balanceSummary.totalExpired.toLocaleString()}</BalanceAmount>
                        <BalanceLabel>{`Expired`}</BalanceLabel>
                    </BalanceItem>
                )}
            </BalanceGrid>
        </SummaryContainer>
    );
}
