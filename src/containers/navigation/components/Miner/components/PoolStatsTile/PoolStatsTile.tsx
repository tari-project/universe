import { useMiningMetricsStore } from '@app/store';
import { formatNumber, FormatPreset } from '@app/utils';
import { LeftContent, RightContent, Wrapper, Title, BalanceVal, Values, MinPayoutVal } from './styles';
import { useTranslation } from 'react-i18next';

export const PoolStatsTile = () => {
    const { t } = useTranslation('p2p');
    const pool_status = useMiningMetricsStore((s) => s.cpu_mining_status.pool_status);
    const loading = !pool_status?.balance && !pool_status?.unpaid && !pool_status;

    const balanceFMT = formatNumber(pool_status?.balance || 0, FormatPreset.XTM_COMPACT);
    const unpaidFMT = formatNumber(pool_status?.unpaid || 0, FormatPreset.XTM_COMPACT);

    return !pool_status ? null : (
        <Wrapper $isLoading={loading}>
            {loading ? (
                <Title>{t('stats.tile-loading')}</Title>
            ) : (
                <>
                    <LeftContent>
                        <Title>{t('stats.tile-heading')}</Title>

                        <Values>
                            <BalanceVal>{`${balanceFMT} XTM`}</BalanceVal>
                            <MinPayoutVal>{`/${unpaidFMT} XTM`}</MinPayoutVal>
                        </Values>
                    </LeftContent>
                    <RightContent></RightContent>
                </>
            )}
        </Wrapper>
    );
};
