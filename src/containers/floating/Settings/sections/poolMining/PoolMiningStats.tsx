import { useTranslation } from 'react-i18next';
import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/floating/Settings/components/SettingsGroup.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useMiningMetricsStore } from '@app/store';

export function PoolMiningStats() {
    const { t } = useTranslation('settings', { useSuspense: false });
    const pool_status = useMiningMetricsStore((s) => s.cpu_mining_status.pool_status);

    const markup = pool_status
        ? Object.entries(pool_status).map(([key, value]) => (
              <Typography key={key}>
                  <b>{key}</b>: {value}
              </Typography>
          ))
        : null;
    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('pool-mining')}</Typography>
                    </SettingsGroupTitle>
                    {markup}
                </SettingsGroupContent>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
