import { useTranslation } from 'react-i18next';
import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/floating/Settings/components/SettingsGroup.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useMiningMetricsStore } from '@app/store';
import { Stack } from '@app/components/elements/Stack';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';
import { formatNumber, FormatPreset } from '@app/utils';
import { useMiningPoolsStore } from '@app/store/useMiningPoolsStore';

export function PoolMiningStats() {
    const { t } = useTranslation(['mining-view', 'settings'], { useSuspense: false });
    const pool_status = useMiningPoolsStore((s) => s.cpuPoolStats);

    const unpaidFMT = formatNumber(pool_status?.unpaid || 0, FormatPreset.XTM_LONG_DEC);
    const balanceFMT = formatNumber(pool_status?.balance || 0, FormatPreset.XTM_LONG_DEC);

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('settings:pool-mining')}</Typography>
                    </SettingsGroupTitle>
                    {pool_status ? (
                        <Stack direction="row" justifyContent="flex-start">
                            <Stack>
                                <Typography variant="p">
                                    {t('pool.accepted_shares')}: <strong>{pool_status?.accepted_shares ?? `-`}</strong>
                                </Typography>
                                <Typography variant="p">
                                    {t('pool.unpaid')}:{' '}
                                    <strong>
                                        {unpaidFMT}
                                        {` XTM`}
                                    </strong>
                                </Typography>
                                <Typography variant="p">
                                    {t('pool.balance')}:{' '}
                                    <strong>
                                        {balanceFMT}
                                        {` XTM`}
                                    </strong>
                                </Typography>
                            </Stack>
                        </Stack>
                    ) : (
                        <LoadingDots />
                    )}
                </SettingsGroupContent>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
