import { useTheme } from 'styled-components';
import { Trans, useTranslation } from 'react-i18next';

import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';

import { formatHashrate, formatNumber, FormatPreset } from '@app/utils/formatters.ts';

import { Typography } from '@app/components/elements/Typography.tsx';

import ModeSelect from './components/ModeSelect.tsx';
import Tile from './components/Tile.tsx';
import { ExpandableTile } from './components/ExpandableTile.tsx';
import { ExpandableTileItem, ExpandedContentTile } from './components/ExpandableTile.styles.ts';
import { MinerContainer, TileContainer, Unit } from './styles.ts';
import { useConfigMiningStore } from '@app/store/useAppConfigStore.ts';

export default function Miner() {
    const theme = useTheme();
    const { t } = useTranslation('mining-view', { useSuspense: false });

    const miningInitiated = useMiningStore((s) => s.miningInitiated);
    const isCpuMiningEnabled = useConfigMiningStore((s) => s.cpu_mining_enabled);
    const isGpuMiningEnabled = useConfigMiningStore((s) => s.gpu_mining_enabled);
    const cpu_estimated_earnings = useMiningMetricsStore((s) => s.cpu_mining_status.estimated_earnings);
    const cpu_hash_rate = useMiningMetricsStore((s) => s.cpu_mining_status.hash_rate);
    const cpu_is_mining = useMiningMetricsStore((s) => s.cpu_mining_status.is_mining);

    const gpu_estimated_earnings = useMiningMetricsStore((s) => s.gpu_mining_status.estimated_earnings);
    const gpu_hash_rate = useMiningMetricsStore((s) => s.gpu_mining_status.hash_rate);
    const gpu_is_mining = useMiningMetricsStore((s) => s.gpu_mining_status.is_mining);
    const isMiningInProgress = cpu_is_mining || gpu_is_mining;

    const isWaitingForCPUHashRate = isCpuMiningEnabled && cpu_is_mining && cpu_hash_rate <= 0;
    const isWaitingForGPUHashRate = isGpuMiningEnabled && gpu_is_mining && gpu_hash_rate <= 0;
    const isLoading = (miningInitiated && !isMiningInProgress) || (isMiningInProgress && !miningInitiated);

    const totalEarnings = cpu_estimated_earnings + gpu_estimated_earnings;
    const earningsLoading = totalEarnings <= 0 && (isWaitingForCPUHashRate || isWaitingForGPUHashRate);

    const totalEarningsFormatted = formatNumber(totalEarnings, FormatPreset.TXTM_COMPACT);
    const estimatedBalanceFormatted = formatNumber(cpu_estimated_earnings, FormatPreset.TXTM_COMPACT);
    const gpuEstimatedEarnings = formatNumber(gpu_estimated_earnings, FormatPreset.TXTM_COMPACT);

    return (
        <MinerContainer>
            <TileContainer>
                <Tile
                    title={t('cpu-power')}
                    stats={isCpuMiningEnabled && cpu_is_mining ? formatHashrate(cpu_hash_rate, false) : '-'}
                    isLoading={isCpuMiningEnabled && (isLoading || isWaitingForCPUHashRate)}
                    chipValue={undefined}
                    unit="H/s"
                    useLowerCase
                />
                <Tile
                    title={t('gpu-power')}
                    stats={isGpuMiningEnabled && gpu_is_mining ? formatHashrate(gpu_hash_rate, false) : '-'}
                    isLoading={isGpuMiningEnabled && (isLoading || isWaitingForGPUHashRate)}
                    chipValue={undefined}
                    unit="H/s"
                    useLowerCase
                />
                <ModeSelect />
                <ExpandableTile
                    title={t('estimated-day')}
                    stats={isMiningInProgress && Number.isFinite(totalEarnings) ? totalEarningsFormatted : '-'}
                    isLoading={earningsLoading}
                    useLowerCase
                >
                    <Typography variant="h5" style={{ color: theme.palette.text.primary }}>
                        {t('estimated-earnings')}
                    </Typography>
                    <Typography>{t('you-earn-rewards-separately')}</Typography>
                    <ExpandedContentTile>
                        <Typography>CPU {t('estimated-earnings')}</Typography>
                        <ExpandableTileItem>
                            <Typography
                                variant="h5"
                                style={{
                                    textTransform: 'lowercase',
                                    fontWeight: 500,
                                    lineHeight: '1.02',
                                }}
                            >
                                {isMiningInProgress && isCpuMiningEnabled && cpu_estimated_earnings
                                    ? estimatedBalanceFormatted
                                    : '-'}
                            </Typography>
                            <Unit>
                                <Typography>
                                    <Trans>XTM/</Trans>
                                    {t('day')}
                                </Typography>
                            </Unit>
                        </ExpandableTileItem>
                    </ExpandedContentTile>
                    <ExpandedContentTile>
                        <Typography>GPU {t('estimated-earnings')}</Typography>
                        <ExpandableTileItem>
                            <Typography
                                variant="h5"
                                style={{
                                    textTransform: 'lowercase',
                                    fontWeight: 500,
                                    lineHeight: '1.02',
                                }}
                            >
                                {isMiningInProgress && isGpuMiningEnabled && gpu_estimated_earnings
                                    ? gpuEstimatedEarnings
                                    : '-'}
                            </Typography>
                            <Unit>
                                <Typography>
                                    <Trans>XTM/</Trans>
                                    {t('day')}
                                </Typography>
                            </Unit>
                        </ExpandableTileItem>
                    </ExpandedContentTile>
                </ExpandableTile>
            </TileContainer>
        </MinerContainer>
    );
}
