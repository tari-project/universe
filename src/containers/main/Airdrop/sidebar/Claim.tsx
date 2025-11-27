import { useAirdropStore } from '@app/store';
import { openTrancheModal } from '@app/store/actions/airdropStoreActions';

import { SidebarItem } from './components/SidebarItem';
import { ActionImgWrapper, RewardTooltipContent, RewardTooltipItems } from './items.style';
import { ParachuteSVG } from '@app/assets/icons/ParachuteSVG';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { FEATURE_FLAGS } from '@app/store/consts.ts';

import { useClaimStatus } from '@app/hooks/airdrop/claim/useClaimStatus';
import { useMemo, useCallback } from 'react';
import { useBalanceSummary } from '@app/hooks/airdrop/tranches/useTrancheStatus.ts';
import { useTrancheAutoRefresh } from '@app/hooks/airdrop/tranches/useTrancheAutoRefresh.ts';

export default function Claim() {
    const { t } = useTranslation('airdrop');
    const features = useAirdropStore((s) => s.features);

    useTrancheAutoRefresh();

    const killswitchEngaged = features?.includes(FEATURE_FLAGS.FF_AD_KS);
    const claimEnabled = features?.includes(FEATURE_FLAGS.FF_AD_CLAIM_ENABLED);
    const claimAvailable = features?.includes(FEATURE_FLAGS.FF_AD_AVAILABLE);

    // Airdrop data hooks (same as modal)
    const balanceSummary = useBalanceSummary();
    const { data: claimStatus, isLoading: claimStatusLoading } = useClaimStatus();

    // Memoize format amount function
    const formatAmount = useCallback((amount: number | undefined | null): string => {
        if (amount === undefined || amount === null || isNaN(amount)) return '0';
        const rounded = Math.round(amount * 100) / 100;
        return (rounded % 1 === 0 ? rounded : rounded).toLocaleString();
    }, []);

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
    const tooltipContent = useMemo(() => {
        if (killswitchEngaged) return null;
        return (
            <RewardTooltipContent>
                <Typography variant="h6">{t('loggedInTitle')}</Typography>

                {claimStatusLoading ? (
                    <Typography variant="p" style={{ color: '#666' }}>
                        {t('tranche.status.loading')}
                    </Typography>
                ) : totalAirdropAmount > 0 || totalClaimedAmount > 0 ? (
                    <RewardTooltipItems>
                        <Typography variant="p">
                            {t('tranche.status.total-airdrop')}: {formatAmount(totalAirdropAmount)} XTM
                        </Typography>

                        <Typography variant="p">
                            {t('tranche.status.total-claimed')}: {formatAmount(totalClaimedAmount)} XTM
                        </Typography>

                        <Typography variant="p">
                            {t('tranche.status.total-due')}: {formatAmount(totalPendingAmount)} XTM
                        </Typography>
                    </RewardTooltipItems>
                ) : (
                    <Typography variant="p" style={{ color: '#666' }}>
                        {t('tranche.status.no-data')}
                    </Typography>
                )}
            </RewardTooltipContent>
        );
    }, [
        claimStatusLoading,
        formatAmount,
        killswitchEngaged,
        t,
        totalAirdropAmount,
        totalClaimedAmount,
        totalPendingAmount,
    ]);

    const canClaim = !killswitchEngaged && claimEnabled && claimAvailable;

    return (
        <SidebarItem tooltipContent={tooltipContent} onClick={canClaim ? openTrancheModal : undefined}>
            <ActionImgWrapper>
                <ParachuteSVG />
            </ActionImgWrapper>
        </SidebarItem>
    );
}
