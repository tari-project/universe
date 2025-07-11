import { useConfigMiningStore, useConfigPoolsStore, useMiningMetricsStore, useMiningStore } from '@app/store';

import { useMiningPoolsStore } from '@app/store/useMiningPoolsStore.ts';
import MinerTile from './Miner.tsx';

export default function CPUTile() {
    const miningInitiated = useMiningStore((s) => s.isCpuMiningInitiated);
    const cpuEnabled = useConfigMiningStore((s) => s.cpu_mining_enabled);
    const cpu_mining_status = useMiningMetricsStore((s) => s.cpu_mining_status);
    const isCpuPoolEnabled = useConfigPoolsStore((s) => s.cpu_pool_enabled);
    const cpuPoolStats = useMiningPoolsStore((s) => s.cpuPoolStats);
    const { hash_rate, is_mining } = cpu_mining_status;

    return (
        <MinerTile
            title="CPU"
            mainLabelKey="cpu-power"
            enabled={cpuEnabled}
            isMining={is_mining}
            isMiningInitiated={miningInitiated}
            hashRate={hash_rate}
            isPoolEnabled={isCpuPoolEnabled}
            poolStats={cpuPoolStats}
            rewardThreshold={2.0}
        />
    );

    // return (
    //     <>
    //         <Tile
    //             title={`CPU`}
    //             isEnabled={cpuEnabled}
    //             isLoading={isLoading || poolStatsLoading}
    //             isMining={is_mining}
    //             pillValue={formatted.value}
    //             pillUnit={formatted.unit}
    //             mainNumber={currentUnpaid}
    //             mainUnit="XTM"
    //             successValue={progressDiff}
    //             mainLabel={t('stats.tile-heading', { context: is_mining && currentUnpaid === 0 && 'zero' })}
    //             tooltipTriggerRef={refs.setReference}
    //             getReferenceProps={getReferenceProps}
    //         />
    //         <AnimatePresence>
    //             {isOpen && (
    //                 <Tooltip ref={refs.setFloating} {...getFloatingProps()} style={floatingStyles}>
    //                     <ExpandedBox
    //                         initial={{ opacity: 0, y: 10 }}
    //                         animate={{ opacity: 1, y: 0 }}
    //                         exit={{ opacity: 0, y: 10 }}
    //                     >
    //                         <Typography variant="h5">{t('stats.tile-heading')}</Typography>
    //                         <Typography variant="p">
    //                             <Trans
    //                                 i18nKey="stats.tooltip-copy"
    //                                 ns="p2p"
    //                                 values={{ amount: REWARD_THRESHOLD_STR }}
    //                                 components={{ strong: <strong /> }}
    //                             />
    //                         </Typography>
    //                         <TooltipChipWrapper>
    //                             <TooltipChip>
    //                                 <TooltipChipHeading>{t('stats.tooltip-tile-heading')}</TooltipChipHeading>
    //                                 <TooltipChipText>{`${unpaidFMT} / ${REWARD_THRESHOLD_STR}`}</TooltipChipText>
    //                             </TooltipChip>
    //                         </TooltipChipWrapper>
    //                     </ExpandedBox>
    //                 </Tooltip>
    //             )}
    //         </AnimatePresence>
    //     </>
    // );
}
