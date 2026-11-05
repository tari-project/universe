import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useL2WalletStore } from '@app/store/useL2WalletStore.ts';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { formatNumber, FormatPreset } from '@app/utils';
import { TopRow, Wrapper } from '@app/containers/navigation/components/MiningTiles/styles.ts';
import {
    BigNumber,
    HeadingRow,
    Inside,
    LabelText,
    LabelWrapper,
    Number,
    NumberGroup,
    NumberLabel,
    NumberUnit,
    RatePill,
    Wrapper as Tile,
} from '@app/containers/navigation/components/MiningTiles/components/Tile/styles.ts';

const ProgressTrack = styled.div`
    width: 100%;
    height: 3px;
    border-radius: 2px;
    background: ${({ theme }) => theme.palette.divider};
`;

const ProgressFill = styled.div`
    height: 100%;
    border-radius: 2px;
    background: ${({ theme }) => theme.palette.success.main};
`;

const ActivityRow = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 10px;
`;

const DASH = '-';

const formatCountdown = (seconds: number) =>
    `${Math.floor(seconds / 60)
        .toString()
        .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

/** Ticks down once a second from `seconds`, the way the L1 block timer ticks up. Remount it to restart. */
function Countdown({ seconds }: { seconds: number }) {
    const [left, setLeft] = useState(seconds);
    useEffect(() => {
        const timer = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(timer);
    }, []);
    return <>{formatCountdown(left)}</>;
}

const pad = (n: number) => n.toString().padStart(2, '0');

// Mirrors the tari.com launch countdown card, dark in both themes like the site.
const CdCard = styled.div`
    width: 100%;
    border-radius: 20px;
    padding: 20px 16px;
    background: #0c0718;
    color: #fbf7ef;
    box-shadow: 0 30px 80px rgba(12, 7, 24, 0.35);
`;

const CdLabel = styled.div`
    font-size: 12px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: rgba(251, 247, 239, 0.55);
    margin-bottom: 6px;
`;

const CdDate = styled.div`
    font-family: DrukWide, sans-serif;
    text-transform: uppercase;
    font-size: 20px;
    color: #813bf5;
    margin-bottom: 16px;
`;

const CdGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
`;

const CdCell = styled.div`
    background: rgba(251, 247, 239, 0.06);
    border: 1px solid rgba(251, 247, 239, 0.12);
    border-radius: 12px;
    padding: 14px 4px 10px;
    text-align: center;
`;

const CdNum = styled.div`
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
    font-size: 26px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
`;

const CdUnit = styled.div`
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(251, 247, 239, 0.5);
    margin-top: 8px;
`;

const CdSoon = styled.div`
    font-family: DrukWide, sans-serif;
    text-transform: uppercase;
    font-size: 18px;
`;

/** Ticks once a second off the clock toward `target` (ms), so it never drifts from the real time left. */
function LaunchCountdown({ target }: { target: number }) {
    const { t } = useTranslation('wallet');
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);
    const left = Math.ceil((target - now) / 1000);
    if (left <= 0) return <CdSoon data-testid="l2-launch-countdown">{t('l2.pre-launch.soon')}</CdSoon>;
    const cells = [
        [Math.floor(left / 86_400), 'days'],
        [Math.floor(left / 3600) % 24, 'hours'],
        [Math.floor(left / 60) % 60, 'minutes'],
        [left % 60, 'seconds'],
    ] as const;
    return (
        <CdGrid data-testid="l2-launch-countdown">
            {cells.map(([n, unit]) => (
                <CdCell key={unit}>
                    <CdNum data-testid="l2-launch-digits">{pad(n)}</CdNum>
                    <CdUnit>{t(`l2.pre-launch.${unit}`)}</CdUnit>
                </CdCell>
            ))}
        </CdGrid>
    );
}

/** Stands in for the network tiles before the Ootle mainnet launch. Nothing shows without a valid launch date in the RWA config. */
export function L2LaunchTile() {
    const { t, i18n } = useTranslation('wallet');
    const launchAt = useAirdropStore((s) => s.config?.['ootle-mainnet-launch-at']);
    const target = typeof launchAt === 'string' ? new Date(launchAt).getTime() : NaN;
    if (isNaN(target)) return null;

    return (
        <CdCard data-testid="l2-launch-tiles">
            <CdLabel>{t('l2.pre-launch.countdown')}</CdLabel>
            <CdDate>
                {new Date(target).toLocaleDateString(i18n.language, { month: 'long', day: 'numeric', year: 'numeric' })}
            </CdDate>
            <LaunchCountdown target={target} />
        </CdCard>
    );
}

function Stat({ value, unit, label }: { value: string; unit?: string; label: string }) {
    return (
        <NumberGroup>
            <BigNumber>
                <Number $isIdle>{value}</Number>
                {unit && <NumberUnit>{unit}</NumberUnit>}
            </BigNumber>
            <NumberLabel>{label}</NumberLabel>
        </NumberGroup>
    );
}

export default function L2Tiles() {
    const { t } = useTranslation('wallet');
    const stats = useL2WalletStore((s) => s.networkStats);
    const blocksLeft = stats ? stats.epoch_length - stats.blocks_into_epoch : 0;
    const xtr = (micro: number | undefined) =>
        micro === undefined ? DASH : formatNumber(micro, FormatPreset.XTM_COMPACT);

    return (
        <Wrapper data-testid="l2-tiles">
            <TopRow>
                <Tile>
                    <Inside>
                        <HeadingRow>
                            <LabelWrapper>
                                <LabelText>{t('l2.tiles.epoch')}</LabelText>
                            </LabelWrapper>
                        </HeadingRow>
                        <Stat
                            value={stats ? formatNumber(stats.epoch, FormatPreset.DECIMAL_COMPACT) : DASH}
                            label={
                                stats
                                    ? t('l2.tiles.epoch-progress', {
                                          block: stats.blocks_into_epoch,
                                          length: stats.epoch_length,
                                      })
                                    : DASH
                            }
                        />
                        <ProgressTrack>
                            <ProgressFill
                                style={{
                                    width: stats ? `${(stats.blocks_into_epoch / stats.epoch_length) * 100}%` : 0,
                                }}
                            />
                        </ProgressTrack>
                    </Inside>
                </Tile>
                <Tile>
                    <Inside>
                        <HeadingRow>
                            <LabelWrapper>
                                <LabelText>{t('l2.tiles.next-epoch')}</LabelText>
                            </LabelWrapper>
                            {stats && <RatePill>{`#${stats.epoch + 1}`}</RatePill>}
                        </HeadingRow>
                        <NumberGroup>
                            <BigNumber>
                                <Number $isIdle data-testid="l2-epoch-countdown">
                                    {stats ? (
                                        <Countdown
                                            key={stats.block_height}
                                            seconds={Math.round(blocksLeft * stats.block_target_secs)}
                                        />
                                    ) : (
                                        DASH
                                    )}
                                </Number>
                            </BigNumber>
                            <NumberLabel>{stats ? t('l2.tiles.blocks-left', { count: blocksLeft }) : DASH}</NumberLabel>
                        </NumberGroup>
                    </Inside>
                </Tile>
            </TopRow>
            <Tile>
                <Inside>
                    <HeadingRow>
                        <LabelWrapper>
                            <LabelText>{t('l2.tiles.activity')}</LabelText>
                        </LabelWrapper>
                    </HeadingRow>
                    <ActivityRow>
                        <Stat
                            value={stats ? formatNumber(stats.tx_count, FormatPreset.COMPACT) : DASH}
                            label={t('l2.tiles.transactions')}
                        />
                        <Stat value={xtr(stats?.fee_volume)} unit="XTR" label={t('l2.tiles.fees')} />
                        <Stat value={xtr(stats?.burned)} unit="XTR" label={t('l2.tiles.burned')} />
                    </ActivityRow>
                </Inside>
            </Tile>
        </Wrapper>
    );
}
