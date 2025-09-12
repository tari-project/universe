import { PoolStats } from '@app/types/app-status';
import { formatHashrate, formatNumber, FormatPreset } from '@app/utils';
import { Trans, useTranslation } from 'react-i18next';
import Tile from './components/Tile/Tile';
import { AnimatePresence } from 'motion/react';
import {
    Tooltip,
    ExpandedBox,
    TooltipChip,
    TooltipChipHeading,
    TooltipChipText,
    TooltipChipWrapper,
} from './styles.ts';
import { Typography } from '@app/components/elements/Typography';
import { offset, useFloating, useHover, useInteractions } from '@floating-ui/react';
import { useState } from 'react';
import { PoolType } from '@app/store/useMiningPoolsStore.ts';
import { AppModuleState, AppModuleStatus } from '@app/store/types/setup.ts';
import { GpuMiningAlgorithm } from '@app/types/events-payloads.ts';
export interface MinerTileProps {
    title: PoolType;
    mainLabelKey: string;
    enabled: boolean;
    isMiningInitiated: boolean;
    isMining: boolean;
    hashRate: number;
    isPoolEnabled: boolean;
    poolStats?: PoolStats;
    rewardThreshold?: number;
    showTooltip?: boolean;
    progressDiff?: number | null;
    unpaidFMT?: string;
    minerModuleState: AppModuleState;
    algo?: GpuMiningAlgorithm;
}

export default function MinerTile({
    title,
    mainLabelKey,
    enabled,
    hashRate,
    isMining,
    isMiningInitiated,
    poolStats,
    isPoolEnabled,
    rewardThreshold,
    showTooltip,
    progressDiff,
    unpaidFMT,
    minerModuleState,
    algo = GpuMiningAlgorithm.SHA3X,
}: MinerTileProps) {
    const { t } = useTranslation(['mining-view', 'p2p'], { useSuspense: false });

    const hasMinerModuleCrashed = minerModuleState.status === AppModuleStatus.Failed;

    const hashrateLoading = enabled && isMining && hashRate <= 0;
    const isLoading = (isMiningInitiated && !isMining) || (isMining && !isMiningInitiated) || hashrateLoading;

    const formattedHashRate = formatHashrate(hashRate, true, algo);
    const currentUnpaid = (poolStats?.unpaid || 0) / 1_000_000;

    const mainNumber = isPoolEnabled ? currentUnpaid : formattedHashRate.value;
    const mainUnit = isPoolEnabled ? 'XTM' : formattedHashRate.unit;

    let mainLabel: string;
    if (enabled && isPoolEnabled) {
        const context = isMining && currentUnpaid === 0 && 'zero';
        mainLabel = t('stats.tile-heading', { context, ns: 'p2p' });
    } else if (enabled) {
        mainLabel = t(mainLabelKey);
    } else {
        mainLabel = t('stats.tile-disabled-heading', { unit: title, ns: 'p2p' });
    }

    const [isOpen, setIsOpen] = useState(false);
    const { refs, context, floatingStyles } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        placement: 'bottom-start',
        middleware: [offset({ mainAxis: 2 })],
    });

    const hover = useHover(context, {
        move: !isOpen,
    });

    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

    const additionalTilePropsForPool = {
        successValue: progressDiff,
        tooltipTriggerRef: refs.setReference,
        getReferenceProps: getReferenceProps,
    };

    const rewardThresholdString = rewardThreshold
        ? `${formatNumber(rewardThreshold, FormatPreset.XTM_COMPACT)} XTM`
        : '2.0 XTM';

    return (
        <>
            <Tile
                title={title}
                isEnabled={enabled}
                isLoading={isLoading}
                isMining={isMining}
                pillValue={formattedHashRate.value}
                pillUnit={formattedHashRate.unit}
                mainNumber={mainNumber} //temporary until we get GPU rewards in progress
                mainUnit={mainUnit}
                mainLabel={mainLabel}
                isIdle={!isPoolEnabled}
                isSoloMining={!isPoolEnabled}
                {...(isPoolEnabled ? additionalTilePropsForPool : {})}
                minerModuleState={minerModuleState}
            />
            <AnimatePresence>
                {enabled && isOpen && showTooltip && !hasMinerModuleCrashed && (
                    <Tooltip ref={refs.setFloating} {...getFloatingProps()} style={floatingStyles}>
                        <ExpandedBox
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                        >
                            <Typography variant="h5">{t('stats.tile-heading', { ns: 'p2p' })}</Typography>
                            <Typography variant="p">
                                <Trans
                                    i18nKey="stats.tooltip-copy"
                                    ns="p2p"
                                    values={{ amount: rewardThresholdString }}
                                    components={{ strong: <strong /> }}
                                />
                            </Typography>
                            <TooltipChipWrapper>
                                <TooltipChip>
                                    <TooltipChipHeading>
                                        {t('stats.tooltip-tile-heading', { ns: 'p2p' })}
                                    </TooltipChipHeading>
                                    <TooltipChipText>{`${unpaidFMT} / ${rewardThresholdString}`}</TooltipChipText>
                                </TooltipChip>
                            </TooltipChipWrapper>
                        </ExpandedBox>
                    </Tooltip>
                )}
            </AnimatePresence>
        </>
    );
}
