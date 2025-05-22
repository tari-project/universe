import { LeftContent, RightContent, Wrapper, Title, BalanceVal, Values, MinPayoutVal } from './styles';
import { useMiningMetricsStore } from '@app/store';
import LoadingDots from '@app/components/transactions/send/SendReview/icons/LoadingDots.tsx';
import { formatNumber, FormatPreset } from '@app/utils';
import { TileItem } from '@app/containers/navigation/components/Miner/styles.ts';
export const PoolStatsTile = () => {
    const pool_status = useMiningMetricsStore((s) => s.cpu_mining_status.pool_status);
    const loading = !pool_status?.balance && !pool_status?.unpaid && !pool_status;

    const balanceFMT = formatNumber(pool_status?.balance || 0, FormatPreset.XTM_COMPACT);
    const unpaidFMT = formatNumber(pool_status?.unpaid || 0, FormatPreset.XTM_COMPACT);

    return !pool_status ? null : (
        <Wrapper>
            <LeftContent>
                <Title>{`Earnings in progress`}</Title>
                {loading ? (
                    <LoadingDots />
                ) : (
                    <Values>
                        <BalanceVal>{`${balanceFMT} XTM`}</BalanceVal>
                        <MinPayoutVal>{`/${unpaidFMT} XTM`}</MinPayoutVal>
                    </Values>
                )}
            </LeftContent>
            <RightContent></RightContent>
        </Wrapper>
    );
};
