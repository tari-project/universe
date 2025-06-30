import { Trans, useTranslation } from 'react-i18next';
import { useConfigMiningStore, useMiningMetricsStore, useMiningStore } from '@app/store';
import { formatHashrate } from '@app/utils';
import Tile from '@app/containers/navigation/components/MiningTiles/components/Tile/Tile.tsx';
import { useCPURewards } from '@app/containers/navigation/components/MiningTiles/useCPURewards.ts';
import { useState } from 'react';
import { offset, useFloating, useHover, useInteractions } from '@floating-ui/react';
import {
    Tooltip,
    TooltipTrigger,
    ExpandedBox,
    TooltipChip,
    TooltipChipHeading,
    TooltipChipText,
    TooltipChipWrapper,
} from './styles.ts';
import { AnimatePresence } from 'motion/react';

import { Typography } from '@app/components/elements/Typography.tsx';

const REWARD_THRESHOLD_STR = `2.0 XTM`;

export default function CPUTile() {
    const { t } = useTranslation('p2p');
    const { progressDiff, unpaidFMT } = useCPURewards();
    const [isOpen, setIsOpen] = useState(false);

    const miningInitated = useMiningStore((s) => s.isCpuMiningInitiated);
    const cpuEnabled = useConfigMiningStore((s) => s.cpu_mining_enabled);
    const cpu_mining_status = useMiningMetricsStore((s) => s.cpu_mining_status);

    const { pool_status, hash_rate, is_mining } = cpu_mining_status;

    const hashrateLoading = cpuEnabled && is_mining && hash_rate <= 0;
    const isLoading = (miningInitated && !is_mining) || (is_mining && !miningInitated) || hashrateLoading;
    const poolStatsLoading = is_mining && !pool_status;

    const formatted = formatHashrate(hash_rate);

    const { refs, context, floatingStyles } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        placement: 'bottom-start',
        middleware: [offset({ mainAxis: 5 })],
    });

    const hover = useHover(context, {
        move: !isOpen,
    });

    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

    const currentUnpaid = (pool_status?.unpaid || 0) / 1_000_000;

    return (
        <>
            <TooltipTrigger ref={refs.setReference} {...getReferenceProps()}>
                <Tile
                    title={`CPU`}
                    isEnabled={cpuEnabled}
                    isLoading={isLoading || poolStatsLoading}
                    isMining={is_mining}
                    pillValue={formatted.value}
                    pillUnit={formatted.unit}
                    mainNumber={currentUnpaid}
                    mainUnit="XTM"
                    successValue={progressDiff}
                    mainLabel={t('stats.tile-heading')}
                />
            </TooltipTrigger>
            <AnimatePresence>
                {isOpen && (
                    <Tooltip ref={refs.setFloating} {...getFloatingProps()} style={floatingStyles}>
                        <ExpandedBox
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                        >
                            <Typography variant="h5">{t('stats.tile-heading')}</Typography>
                            <Typography variant="p">
                                <Trans
                                    i18nKey="stats.tooltip-copy"
                                    ns="p2p"
                                    values={{ amount: REWARD_THRESHOLD_STR }}
                                    components={{ strong: <strong /> }}
                                />
                            </Typography>
                            <TooltipChipWrapper>
                                <TooltipChip>
                                    <TooltipChipHeading>{t('stats.tooltip-tile-heading')}</TooltipChipHeading>
                                    <TooltipChipText>{`${unpaidFMT} / ${REWARD_THRESHOLD_STR}`}</TooltipChipText>
                                </TooltipChip>
                            </TooltipChipWrapper>
                        </ExpandedBox>
                    </Tooltip>
                )}
            </AnimatePresence>
        </>
    );
}
