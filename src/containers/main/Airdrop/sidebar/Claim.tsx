import { useMemo } from 'react';
import { useAirdropStore } from '@app/store';
import { openTrancheModal } from '@app/store/actions/airdropStoreActions';

import { SidebarItem } from './components/SidebarItem';
import { ActionImgWrapper, RewardTooltipContent, RewardTooltipItems } from './items.style';
import { ParachuteSVG } from '@app/assets/icons/ParachuteSVG';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { FEATURE_FLAGS } from '@app/store/consts.ts';

import { useClaimStatus } from '@app/hooks/airdrop/claim/useClaimStatus';
import { useBalanceSummary } from '@app/hooks/airdrop/tranches/useTrancheStatus.ts';
import { useTrancheAutoRefresh } from '@app/hooks/airdrop/tranches/useTrancheAutoRefresh.ts';
import { formatNumber, FormatPreset } from '@app/utils';

export default function Claim() {
    const { t } = useTranslation('airdrop');
    const features = useAirdropStore((s) => s.features);
    const killswitchEngaged = features?.includes(FEATURE_FLAGS.FF_AD_KS);
    const claimEnabled = features?.includes(FEATURE_FLAGS.FF_AD_CLAIM_ENABLED);
    const claimAvailable = features?.includes(FEATURE_FLAGS.FF_AD_AVAILABLE);

    const balanceSummary = useBalanceSummary();
    const { data: claimStatus, isLoading: claimStatusLoading } = useClaimStatus();

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
    }, [balanceSummary, claimStatus?.amount]);
    const { total: totalAirdropAmount, claimed: totalClaimedAmount, pending: totalPendingAmount } = totalValues;
    const isIneligible = !claimStatusLoading && (!totalAirdropAmount || totalAirdropAmount === 0);
    useTrancheAutoRefresh({ enabled: !killswitchEngaged && !isIneligible });

    const tooltipContent = useMemo(() => {
        if (killswitchEngaged) return null;

        const formatAmount = (amount: number | undefined | null): string => {
            if (amount === undefined || amount === null || isNaN(amount)) return '0';
            const rounded = Math.round(amount * 100) / 100;
            return formatNumber(rounded * 1_000_000, FormatPreset.XTM_LONG_DEC);
        };
        if (isIneligible) {
            return (
                <RewardTooltipContent>
                    <Typography variant="h6">{t('tranche.status.ineligible')}</Typography>
                </RewardTooltipContent>
            );
        }
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
        isIneligible,
        killswitchEngaged,
        t,
        totalAirdropAmount,
        totalClaimedAmount,
        totalPendingAmount,
    ]);

    const canClaim = !killswitchEngaged && claimEnabled && claimAvailable && !isIneligible;
    return (
        <SidebarItem tooltipContent={tooltipContent} onClick={canClaim ? openTrancheModal : undefined}>
            <ActionImgWrapper>
                <ParachuteSVG />
            </ActionImgWrapper>
        </SidebarItem>
    );
}
