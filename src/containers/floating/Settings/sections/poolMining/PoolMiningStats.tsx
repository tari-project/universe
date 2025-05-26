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

export function PoolMiningStats() {
    const { t } = useTranslation(['mining-view', 'settings'], { useSuspense: false });
    const pool_status = useMiningMetricsStore((s) => s.cpu_mining_status.pool_status);
    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('settings:pool-mining')}</Typography>
                    </SettingsGroupTitle>
                    {pool_status ? (
                        <Stack direction="row" justifyContent="flex-start">
                            <Stack style={{ width: '50%' }}>
                                <Typography variant="p">
                                    {t('pool.accepted_shares')}: <strong>{pool_status?.accepted_shares ?? `-`}</strong>
                                </Typography>
                                <Typography variant="p">
                                    {t('pool.min_payout')}: <strong>{pool_status?.min_payout ?? `-`}</strong>
                                </Typography>
                            </Stack>
                            <Stack style={{ width: '50%' }}>
                                <Typography variant="p">
                                    {t('pool.unpaid')}: <strong>{pool_status?.unpaid ?? `-`}</strong>
                                </Typography>
                                <Typography variant="p">
                                    {t('pool.balance')}: <strong>{pool_status?.balance ?? `-`}</strong>
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
