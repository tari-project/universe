import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import { useShallow } from 'zustand/react/shallow';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { CardContainer } from '../Settings.styles';
import { CardComponent } from '@app/containers/SideBar/components/Settings/Card.component.tsx';
import { MinerContainer } from '../../../Miner/styles';
import { useTranslation } from 'react-i18next';
import { Divider } from '@app/components/elements/Divider.tsx';

const P2PoolStats = () => {
    const { t } = useTranslation('settings', { useSuspense: false });

    const { walletAddress, p2poolStats } = useAppStatusStore(
        useShallow((s) => ({
            walletAddress: s.tari_address_base58,
            p2poolStats: s.p2pool_stats,
        }))
    );

    const { isP2poolEnabled } = useAppStatusStore(
        useShallow((s) => ({
            isP2poolEnabled: s.p2pool_enabled,
        }))
    );

    const p2poolSha3Stats = p2poolStats?.sha3;
    const p2poolRandomXStats = p2poolStats?.randomx;
    const p2poolTribe = p2poolSha3Stats?.tribe?.name;
    const p2poolSha3MinersCount = p2poolSha3Stats?.num_of_miners;
    const p2poolRandomxMinersCount = p2poolRandomXStats?.num_of_miners;
    const p2poolSha3HashRate = p2poolSha3Stats?.pool_hash_rate;
    const p2poolRandomxHashRate = p2poolRandomXStats?.pool_hash_rate;
    const p2poolSha3TotalEarnings = p2poolSha3Stats?.pool_total_earnings;
    const p2poolRandomxTotalEarnings = p2poolRandomXStats?.pool_total_earnings;
    const p2poolSha3ChainTip = p2poolSha3Stats?.share_chain_height;
    const p2poolRandomxChainTip = p2poolRandomXStats?.share_chain_height;
    const p2poolSha3UserTotalEarnings = walletAddress ? p2poolSha3Stats?.total_earnings[walletAddress] : 0;
    const p2poolRandomxUserTotalEarnings = walletAddress ? p2poolRandomXStats?.total_earnings[walletAddress] : 0;
    const p2poolUserTotalEarnings =
        p2poolSha3UserTotalEarnings && p2poolRandomxUserTotalEarnings
            ? p2poolSha3UserTotalEarnings + p2poolRandomxUserTotalEarnings
            : 0;

    return isP2poolEnabled ? (
        <MinerContainer>
            <Divider />
            <Stack>
                <Typography variant="h6">{t('p2pool-stats')}</Typography>
                <CardContainer>
                    <CardComponent
                        heading={`${t('tribe')}`}
                        labels={[
                            {
                                labelText: t('current'),
                                labelValue: p2poolTribe ? p2poolTribe : '',
                            },
                        ]}
                    />
                    <CardComponent
                        heading={`${t('miners')}`}
                        labels={[
                            {
                                labelText: 'SHA-3',
                                labelValue: '' + p2poolSha3MinersCount,
                            },
                            {
                                labelText: 'RandomX',
                                labelValue: '' + p2poolRandomxMinersCount,
                            },
                        ]}
                    />
                    <CardComponent
                        heading={`${t('p2pool-hash-rate')}`}
                        labels={[
                            {
                                labelText: 'SHA-3',
                                labelValue: (p2poolSha3HashRate ? p2poolSha3HashRate : 0) + ' H/s',
                            },
                            {
                                labelText: 'RandomX',
                                labelValue: (p2poolRandomxHashRate ? p2poolRandomxHashRate : 0) + ' H/s',
                            },
                        ]}
                    />
                    <CardComponent
                        heading={`${t('p2pool-total-earnings')}`}
                        labels={[
                            {
                                labelText: 'SHA-3',
                                labelValue: (p2poolSha3TotalEarnings ? p2poolSha3TotalEarnings : 0) + ' tXTM',
                            },
                            {
                                labelText: 'RandomX',
                                labelValue: (p2poolRandomxTotalEarnings ? p2poolRandomxTotalEarnings : 0) + ' tXTM',
                            },
                        ]}
                    />
                    <CardComponent
                        heading={`${t('p2pool-chain-tip')}`}
                        labels={[
                            {
                                labelText: 'SHA-3',
                                labelValue: '#' + p2poolSha3ChainTip,
                            },
                            {
                                labelText: 'RandomX',
                                labelValue: '#' + p2poolRandomxChainTip,
                            },
                        ]}
                    />
                    <CardComponent
                        heading={`${t('p2pool-user-total-earnings')}`}
                        labels={[
                            {
                                labelText: 'SHA-3',
                                labelValue: (p2poolSha3UserTotalEarnings ? p2poolSha3UserTotalEarnings : 0) + ' tXTM',
                            },
                            {
                                labelText: 'RandomX',
                                labelValue:
                                    (p2poolRandomxUserTotalEarnings ? p2poolRandomxUserTotalEarnings : 0) + ' tXTM',
                            },
                            {
                                labelText: t('total'),
                                labelValue: p2poolUserTotalEarnings + ' tXTM',
                            },
                        ]}
                    />
                </CardContainer>
            </Stack>
        </MinerContainer>
    ) : null;
};

export default P2PoolStats;
