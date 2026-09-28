import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useL2WalletStore } from '@app/store/useL2WalletStore.ts';
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
