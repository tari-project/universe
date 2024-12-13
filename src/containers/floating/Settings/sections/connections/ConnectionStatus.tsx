import { Stack } from '@app/components/elements/Stack.tsx';

import { ConnectionIcon } from '../../components/Settings.styles.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { useMiningStore } from '@app/store/useMiningStore.ts';

export default function ConnectionStatus() {
    const { t } = useTranslation('settings');
    const isConnectedToTariNetwork = useMiningStore((s) => s.base_node?.is_connected);
    return (
        <Stack direction="row" justifyContent="right" alignItems="center">
            <ConnectionIcon $isConnected={isConnectedToTariNetwork} size={20} />
            <Typography variant="p">
                {t(isConnectedToTariNetwork ? 'connected-to-tari' : 'not-connected-to-tari')}
            </Typography>
        </Stack>
    );
}
