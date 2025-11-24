import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation('airdrop', { useSuspense: false });
    const { data: trancheStatus, isLoading, error } = useTrancheStatus();
    const balanceSummary = useBalanceSummary();

    if (isLoading) {
        return (
            <Card className={className}>
                <LoadingContainer>
                    <LoadingSpinner />
                    <span>{t('tranche.status.loading')}</span>
                </LoadingContainer>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={className}>
                <ErrorContainer>
                    <ErrorText>{t('tranche.status.error')}</ErrorText>
                </ErrorContainer>
            </Card>
        );
    }

    if (!trancheStatus || !balanceSummary) {
        return (
            <Card className={className}>
                <ErrorContainer>
                    <ErrorText>{t('tranche.status.no-data')}</ErrorText>
                </ErrorContainer>
            </Card>
        );
    }

    const progressPercentage =
        trancheStatus.totalTranches > 0 ? (trancheStatus.claimedCount / trancheStatus.totalTranches) * 100 : 0;

    const nextAvailableDate = trancheStatus.nextAvailable
        ? new Date(trancheStatus.nextAvailable).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
          })
        : null;

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>{t('tranche.status.progress-title')}</CardTitle>
            </CardHeader>

            <CardContent>
                <StatusGrid>
                    <StatusItem>
                        <StatusLabel>{t('tranche.status.total-allocation')}</StatusLabel>
                        <StatusValue>{balanceSummary.totalXtm.toLocaleString()} XTM</StatusValue>
                    </StatusItem>

                    <StatusItem>
                        <StatusLabel>{t('tranche.status.claimed')}</StatusLabel>
                        <StatusValue>{balanceSummary.totalClaimed.toLocaleString()} XTM</StatusValue>
                    </StatusItem>

                    <StatusItem>
                        <StatusLabel>{t('tranche.status.pending')}</StatusLabel>
                        <StatusValue>{balanceSummary.totalPending.toLocaleString()} XTM</StatusValue>
                    </StatusItem>

                    <StatusItem>
                        <StatusLabel>{t('tranche.status.available')}</StatusLabel>
                        <StatusValue>
                            {trancheStatus.availableCount} {t('tranche.status.tranches')}
                        </StatusValue>
                    </StatusItem>
                </StatusGrid>

                <ProgressSection>
                    <ProgressText>
                        {`${trancheStatus.claimedCount} of ${trancheStatus.totalTranches} ${t('tranche.status.tranches')} 
                        ${t('tranche.status.claimed').toLowerCase()}`}
                    </ProgressText>
                    <ProgressBar>
                        <ProgressFill $percentage={progressPercentage} />
                    </ProgressBar>
                </ProgressSection>

                {trancheStatus.availableCount === 0 && nextAvailableDate && (
                    <NextTrancheSection>
                        <NextTrancheLabel>{t('tranche.status.next-available')}</NextTrancheLabel>
                        <NextTrancheDate>{nextAvailableDate}</NextTrancheDate>
                    </NextTrancheSection>
                )}
            </CardContent>
        </Card>
    );
}
