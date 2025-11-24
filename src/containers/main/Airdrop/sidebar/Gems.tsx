import { useAirdropStore } from '@app/store';
import { openTrancheModal } from '@app/store/actions/airdropStoreActions';
import { formatNumber, FormatPreset } from '@app/utils';
import { SidebarItem } from './components/SidebarItem';
import { ActionImgWrapper } from './items.style';
import { ParachuteSVG } from '@app/assets/icons/ParachuteSVG';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { FEATURE_FLAGS } from '@app/store/consts.ts';
import { useBalanceSummary, useCurrentMonthTranche } from '@app/hooks/airdrop/tranches';
import { useClaimStatus } from '@app/hooks/airdrop/claim/useClaimStatus';
import { useEffect, useState, useMemo, useCallback } from 'react';

interface CountdownTime {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export default function Gems() {
    const { t } = useTranslation('airdrop');
    const gemCount = useAirdropStore((s) => s.userPoints?.base?.gems || s.userDetails?.user?.rank?.gems || 0);
    const features = useAirdropStore((s) => s.features);
    const formattedCountCompact = formatNumber(gemCount, FormatPreset.COMPACT);

    // Airdrop data hooks (same as modal)
    const balanceSummary = useBalanceSummary();
    const { currentTranche } = useCurrentMonthTranche();
    const { data: claimStatus, isLoading: claimStatusLoading } = useClaimStatus();
    const trancheStatus = useAirdropStore((state) => state.trancheStatus);

    // State for countdown
    const [countdown, setCountdown] = useState<CountdownTime | null>(null);

    // Find next available tranche
    const futureTranche = trancheStatus?.tranches.find((t) => !t.claimed && new Date(t.validFrom) > new Date());

    // Optimized countdown effect - update less frequently when time is far out
    useEffect(() => {
        if (!futureTranche) {
            setCountdown(null);
            return;
        }

        const updateCountdown = () => {
            const now = new Date().getTime();
            const futureTime = new Date(futureTranche.validFrom).getTime();
            const timeDiff = futureTime - now;

            if (timeDiff <= 0) {
                setCountdown(null);
                return;
            }

            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

            setCountdown({ days, hours, minutes, seconds });
        };

        updateCountdown();

        // Dynamic interval: update every second only if less than 1 hour, otherwise every minute
        const now = new Date().getTime();
        const futureTime = new Date(futureTranche.validFrom).getTime();
        const timeDiff = futureTime - now;
        const intervalTime = timeDiff <= 60 * 60 * 1000 ? 1000 : 60000;
        const interval = setInterval(updateCountdown, intervalTime);

        return () => clearInterval(interval);
    }, [futureTranche]);

    // Memoize format countdown function
    const formatCountdown = useCallback((countdown: CountdownTime) => {
        const parts: string[] = [];
        if (countdown.days > 0) parts.push(`${countdown.days}D`);
        if (countdown.days > 0 || countdown.hours > 0) parts.push(`${countdown.hours}H`);
        parts.push(`${countdown.minutes}M`);
        parts.push(`${countdown.seconds}S`);
        return parts.join(' ');
    }, []);

    // Memoize format amount function
    const formatAmount = useCallback((amount: number | undefined | null): string => {
        if (amount === undefined || amount === null || isNaN(amount)) return '0';
        const rounded = Math.round(amount * 100) / 100;
        return (rounded % 1 === 0 ? rounded : rounded).toLocaleString();
    }, []);

    // Determine next reward amount and countdown
    const nextRewardAmount = currentTranche?.amount || futureTranche?.amount;

    // Memoize calculations to prevent unnecessary rerenders
    const totalValues = useMemo(() => {
        const totalOriginalAmount = claimStatus?.amount || 0;

        if (!totalOriginalAmount) return { total: 0, claimed: 0, pending: 0 };

        if (balanceSummary) {
            const claimed = balanceSummary.totalClaimed;
            const expired = balanceSummary.totalExpired;
            const pending = totalOriginalAmount - claimed - expired;
            return { total: totalOriginalAmount, claimed, pending };
        }

        // Fallback if no balance summary
        return { total: totalOriginalAmount, claimed: 0, pending: totalOriginalAmount };
    }, [claimStatus?.amount, balanceSummary]);

    const { total: totalAirdropAmount, claimed: totalClaimedAmount, pending: totalPendingAmount } = totalValues;

    // Memoize tooltip content to prevent unnecessary rerenders
    const tooltipContent = useMemo(
        () => (
            <div style={{ textAlign: 'left' }}>
                <Typography variant="h6" style={{ marginBottom: '8px' }}>
                    {t('loggedInTitle')}
                </Typography>

                {claimStatusLoading ? (
                    <Typography variant="p" style={{ color: '#666' }}>
                        {t('tranche.status.loading')}
                    </Typography>
                ) : totalAirdropAmount > 0 || totalClaimedAmount > 0 ? (
                    <>
                        <Typography variant="p" style={{ marginBottom: '4px', color: '#666' }}>
                            {t('tranche.status.total-airdrop')}: {formatAmount(totalAirdropAmount)} XTM
                        </Typography>

                        <Typography variant="p" style={{ marginBottom: '4px', color: '#666' }}>
                            {t('tranche.status.total-claimed')}: {formatAmount(totalClaimedAmount)} XTM
                        </Typography>

                        <Typography variant="p" style={{ marginBottom: '12px', color: '#666' }}>
                            {t('tranche.status.total-due')}: {formatAmount(totalPendingAmount)} XTM
                        </Typography>

                        {nextRewardAmount && !isNaN(nextRewardAmount) && (
                            <>
                                <Typography variant="p" style={{ marginBottom: '4px', fontWeight: 'bold' }}>
                                    {t('tranche.status.next-reward')}
                                </Typography>
                                <Typography variant="h6" style={{ marginBottom: countdown ? '4px' : '8px' }}>
                                    {formatAmount(nextRewardAmount)} XTM
                                </Typography>
                                {countdown && (
                                    <Typography variant="p" style={{ marginBottom: '8px', color: '#666' }}>
                                        {t('tranche.status.available-in')} {formatCountdown(countdown)}
                                    </Typography>
                                )}
                            </>
                        )}
                    </>
                ) : (
                    <Typography variant="p" style={{ color: '#666' }}>
                        {t('tranche.status.no-data')}
                    </Typography>
                )}
            </div>
        ),
        [
            t,
            claimStatusLoading,
            totalAirdropAmount,
            totalClaimedAmount,
            formatAmount,
            totalPendingAmount,
            nextRewardAmount,
            countdown,
            formatCountdown,
        ]
    );

    const handleClick = useCallback(() => {
        openTrancheModal();
    }, []);

    const killswitchOn = features?.includes(FEATURE_FLAGS.FF_AD_KS);
    const claimEnabled = features?.includes(FEATURE_FLAGS.FF_AD_CLAIM_ENABLED);

    const canClaim = !killswitchOn && claimEnabled;

    return (
        <SidebarItem
            text={canClaim ? '' : formattedCountCompact}
            tooltipContent={tooltipContent}
            onClick={canClaim ? handleClick : undefined}
        >
            <ActionImgWrapper>
                <ParachuteSVG />
            </ActionImgWrapper>
        </SidebarItem>
    );
}
