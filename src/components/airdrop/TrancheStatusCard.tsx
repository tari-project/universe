import { useTrancheStatus, useBalanceSummary } from '@app/hooks/airdrop/tranches';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    StatusGrid,
    StatusItem,
    StatusLabel,
    StatusValue,
    ProgressSection,
    ProgressBar,
    ProgressFill,
    ProgressText,
    NextTrancheSection,
    NextTrancheLabel,
    NextTrancheDate,
    LoadingContainer,
    LoadingSpinner,
    ErrorContainer,
    ErrorText,
} from './TrancheStatusCard.styles';

interface TrancheStatusCardProps {
    className?: string;
}

export function TrancheStatusCard({ className }: TrancheStatusCardProps) {
    const { data: trancheStatus, isLoading, error } = useTrancheStatus();
    const balanceSummary = useBalanceSummary();

    if (isLoading) {
        return (
            <Card className={className}>
                <LoadingContainer>
                    <LoadingSpinner />
                    <span>Loading tranche status...</span>
                </LoadingContainer>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={className}>
                <ErrorContainer>
                    <ErrorText>Failed to load tranche status</ErrorText>
                </ErrorContainer>
            </Card>
        );
    }

    if (!trancheStatus || !balanceSummary) {
        return (
            <Card className={className}>
                <ErrorContainer>
                    <ErrorText>No tranche data available</ErrorText>
                </ErrorContainer>
            </Card>
        );
    }

    const progressPercentage = trancheStatus.totalTranches > 0 
        ? (trancheStatus.claimedCount / trancheStatus.totalTranches) * 100 
        : 0;

    const nextAvailableDate = trancheStatus.nextAvailable 
        ? new Date(trancheStatus.nextAvailable).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        })
        : null;

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Airdrop Progress</CardTitle>
            </CardHeader>
            
            <CardContent>
                <StatusGrid>
                    <StatusItem>
                        <StatusLabel>Total Allocation</StatusLabel>
                        <StatusValue>{balanceSummary.totalXtm.toLocaleString()} XTM</StatusValue>
                    </StatusItem>
                    
                    <StatusItem>
                        <StatusLabel>Claimed</StatusLabel>
                        <StatusValue>{balanceSummary.totalClaimed.toLocaleString()} XTM</StatusValue>
                    </StatusItem>
                    
                    <StatusItem>
                        <StatusLabel>Pending</StatusLabel>
                        <StatusValue>{balanceSummary.totalPending.toLocaleString()} XTM</StatusValue>
                    </StatusItem>
                    
                    <StatusItem>
                        <StatusLabel>Available</StatusLabel>
                        <StatusValue>{trancheStatus.availableCount} tranches</StatusValue>
                    </StatusItem>
                </StatusGrid>

                <ProgressSection>
                    <ProgressText>
                        {trancheStatus.claimedCount} of {trancheStatus.totalTranches} tranches claimed
                    </ProgressText>
                    <ProgressBar>
                        <ProgressFill $percentage={progressPercentage} />
                    </ProgressBar>
                </ProgressSection>

                {trancheStatus.availableCount === 0 && nextAvailableDate && (
                    <NextTrancheSection>
                        <NextTrancheLabel>Next tranche available:</NextTrancheLabel>
                        <NextTrancheDate>{nextAvailableDate}</NextTrancheDate>
                    </NextTrancheSection>
                )}
            </CardContent>
        </Card>
    );
}
