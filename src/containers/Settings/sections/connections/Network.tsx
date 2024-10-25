import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/Settings/components/SettingsGroup.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { Stack } from '@app/components/elements/Stack.tsx';
import { formatHashrate } from '@app/utils/formatHashrate.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import ConnectionStatus from '@app/containers/Settings/sections/connections/ConnectionStatus.tsx';

export default function Network() {
    const { t } = useTranslation('settings');
    const sha_network_hash_rate = useMiningStore((state) => state?.sha_network_hash_rate);
    const randomx_network_hash_rate = useMiningStore((state) => state?.randomx_network_hash_rate);
    return (
        <SettingsGroupWrapper>
            <SettingsGroupContent>
                <SettingsGroupTitle>
                    <Typography variant="h6">{t('network')}</Typography>
                    <ConnectionStatus />
                </SettingsGroupTitle>
                <br />
                <SettingsGroup>
                    <Stack direction="column" alignItems="flex-start">
                        <Stack direction="row">
                            <Typography variant="p">{t('sha-network-hash-rate')}</Typography>
                            <Typography>
                                <b>{formatHashrate(sha_network_hash_rate || 0)}</b>
                            </Typography>
                        </Stack>
                        <Stack direction="row">
                            <Typography variant="p">{t('randomx-network-hash-rate')}</Typography>
                            <Typography>
                                <b>{formatHashrate(randomx_network_hash_rate || 0)}</b>
                            </Typography>
                        </Stack>
                    </Stack>
                </SettingsGroup>
            </SettingsGroupContent>
        </SettingsGroupWrapper>
    );
}
