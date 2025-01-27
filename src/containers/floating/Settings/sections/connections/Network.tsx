import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';

import ConnectionStatus from '../connections/ConnectionStatus.tsx';

import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';
import { formatHashrate } from '@app/utils/formatters.ts';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';

export default function Network() {
    const { t } = useTranslation('settings');
    const sha_network_hash_rate = useMiningMetricsStore((state) => state?.base_node_status?.sha_network_hash_rate);
    const randomx_network_hash_rate = useMiningMetricsStore(
        (state) => state?.base_node_status?.randomx_network_hash_rate
    );
    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('network')}</Typography>
                        <ConnectionStatus />
                    </SettingsGroupTitle>
                    <SettingsGroupContent>
                        <Stack direction="column" alignItems="flex-start">
                            <span />
                            <Stack direction="row">
                                <Typography>{t('sha-network-hash-rate')}</Typography>
                                <Typography>
                                    <b>{formatHashrate(sha_network_hash_rate || 0)}</b>
                                </Typography>
                            </Stack>
                            <Stack direction="row">
                                <Typography>{t('randomx-network-hash-rate')}</Typography>
                                <Typography>
                                    <b>{formatHashrate(randomx_network_hash_rate || 0)}</b>
                                </Typography>
                            </Stack>
                        </Stack>
                    </SettingsGroupContent>
                </SettingsGroupContent>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
