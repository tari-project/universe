import { LeftContent, RightContent, Wrapper, Title, BalanceVal, Values, MinPayoutVal } from './styles';
import { useMiningMetricsStore } from '@app/store';
export const PoolStatsTile = () => {
    const pool_status = useMiningMetricsStore((s) => s.cpu_mining_status.pool_status);
    console.debug(pool_status);
    return (
        <Wrapper>
            <LeftContent>
                <Title>{`Earnings in progress`}</Title>
                <Values>
                    <BalanceVal>{`${pool_status?.balance} XTM`}</BalanceVal>
                    <MinPayoutVal>{`/${pool_status?.unpaid} XTM`}</MinPayoutVal>
                </Values>
            </LeftContent>
            <RightContent></RightContent>
        </Wrapper>
    );
};
