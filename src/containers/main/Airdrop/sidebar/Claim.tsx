import { useEffect, useMemo, useRef } from 'react';
import { useAirdropStore } from '@app/store';
import { openTrancheModal } from '@app/store/actions/airdropStoreActions';

import { SidebarItem } from './components/SidebarItem';
import {
    ActionImgWrapper,
    NextRewardWrapper,
    RewardTooltipContent,
    RewardTooltipItem,
    RewardTooltipItems,
    TooltipHeader,
} from './items.style';
import { ParachuteSVG } from '@app/assets/icons/ParachuteSVG';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { FEATURE_FLAGS } from '@app/store/consts.ts';

import { useClaimStatus } from '@app/hooks/airdrop/claim/useClaimStatus';
import { useBalanceSummary } from '@app/hooks/airdrop/tranches/useTrancheStatus.ts';
import { useTrancheAutoRefresh } from '@app/hooks/airdrop/tranches/useTrancheAutoRefresh.ts';
import { formatNumber, FormatPreset, formatAmountWithKM } from '@app/utils';
import { ClaimStatus } from '@app/types/airdrop-claim.ts';
import Countdown from '@app/components/airdrop/Countdown.tsx';

interface ClaimTooltipProps {
    claimStatus?: ClaimStatus;
    claimStatusLoading?: boolean;
    nextAvailable?: string | null;
}

const formatAmount = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null || isNaN(amount)) return '0';
    const rounded = Math.round(amount * 100) / 100;
    return formatNumber(rounded * 1_000_000, FormatPreset.XTM_LONG_DEC);
};

function ClaimTooltip({ claimStatus, claimStatusLoading, nextAvailable }: ClaimTooltipProps) {
    const { t } = useTranslation('airdrop');
    const balanceSummary = useBalanceSummary();

    const claimTotal = claimStatus?.amount || 0;
    const values = useMemo(() => {
        if (!claimTotal) return { total: 0, claimed: 0, pending: 0 };
        const total = claimTotal;
        if (balanceSummary) {
            const claimed = balanceSummary.totalClaimed;
            const expired = balanceSummary.totalExpired;
            const pending = total - claimed - expired;
            return { total, claimed, pending };
        }

        // Fallback if no balance summary
        return { total, claimed: 0, pending: total };
    }, [balanceSummary, claimTotal]);

    const isIneligible = !claimStatusLoading && (!claimTotal || claimTotal === 0 || claimStatus?.claimTarget !== 'xtm');
    const hasClaims = values.total > 0 || values.claimed > 0;

    const ineligibleMarkup = isIneligible && <Typography variant="h6">{t('tranche.status.ineligible')}</Typography>;
    const loadingMarkup = claimStatusLoading && (
        <RewardTooltipItem style={{ color: '#666' }}>{t('tranche.status.loading')}</RewardTooltipItem>
    );

    const nextItemMarkup = nextAvailable ? (
        <>
            <NextRewardWrapper>
                <RewardTooltipItem>{t('tranche.status.next-reward')}</RewardTooltipItem>
                <Typography variant="h5">{formatAmount(balanceSummary?.nextAvailableAmount)}</Typography>
            </NextRewardWrapper>
            <Countdown futureTime={nextAvailable} compact />
        </>
    ) : null;

    const markup = hasClaims && !claimStatusLoading && (
        <RewardTooltipItems>
            <RewardTooltipItem>
                {t('tranche.status.total-airdrop')} <strong>{formatAmount(values.total)}</strong>
            </RewardTooltipItem>
            {!nextAvailable && (
                <RewardTooltipItem>
                    {t('tranche.status.total-claimed')}: <strong> {formatAmount(values.claimed)} XTM</strong>
                </RewardTooltipItem>
            )}
            {nextItemMarkup}
        </RewardTooltipItems>
    );

    return (
        <RewardTooltipContent>
            {ineligibleMarkup}
            {!isIneligible && <TooltipHeader>{t('loggedInTitle')}</TooltipHeader>}
            {loadingMarkup}
            {markup}
        </RewardTooltipContent>
    );
}

export default function Claim() {
    const features = useAirdropStore((s) => s.features);
    const claimEnabled = !!features?.includes(FEATURE_FLAGS.FF_AD_CLAIM_ENABLED);
    const initialFetched = useRef(false);
    const trancheStatus = useAirdropStore((state) => state.trancheStatus);
    const { data: claimStatus, isLoading: claimStatusLoading } = useClaimStatus();
    const { refreshTranches } = useTrancheAutoRefresh({ enabled: claimEnabled });

    const canClaim = claimEnabled && !!claimStatus?.hasClaim && !!trancheStatus?.availableCount;
    const claimAmount = canClaim && claimStatus?.amount ? `${formatAmountWithKM(claimStatus?.amount)} XTM` : undefined;

    useEffect(() => {
        if (initialFetched.current) return;
        if (canClaim) {
            refreshTranches().then(() => (initialFetched.current = true));
        }
    }, [canClaim, refreshTranches]);

    const tooltipContent = (
        <ClaimTooltip
            claimStatus={claimStatus}
            claimStatusLoading={claimStatusLoading}
            nextAvailable={!canClaim ? trancheStatus?.nextAvailable : undefined}
        />
    );

    return (
        <SidebarItem
            tooltipContent={tooltipContent}
            onClick={canClaim ? openTrancheModal : undefined}
            text={claimAmount}
        >
            <ActionImgWrapper>
                <ParachuteSVG />
            </ActionImgWrapper>
        </SidebarItem>
    );
}
