import { Stack } from '@app/components/elements/Stack.tsx';

import { ConnectionIcon } from '../../components/Settings.styles.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';

export default function ConnectionStatus() {
    const { t } = useTranslation('settings');
    const isConnectedToTariNetwork = useMiningMetricsStore((s) => s.connected_peers?.length > 0);

    return (
        <Stack direction="row" justifyContent="right" alignItems="center">
            <ConnectionIcon $isConnected={isConnectedToTariNetwork} size={20} />
            <Typography variant="p">
                {t(isConnectedToTariNetwork ? 'connected-to-tari' : 'not-connected-to-tari')}
            </Typography>
        </Stack>
    );
}
