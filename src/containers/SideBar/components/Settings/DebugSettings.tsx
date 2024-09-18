import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { Stack } from '@app/components/elements/Stack.tsx';
import { useMiningStore } from '@app/store/useMiningStore';
import { ConnectionIcon } from './Settings.styles';

export default function DebugSettings() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const lastBlockTime = useMiningStore((state) => state.displayBlockTime);
    const isConnectedToTariNetwork = useMiningStore((s) => s.base_node?.is_connected);

    const { daysString, hoursString, minutes, seconds } = lastBlockTime || {};
    const displayTime = `${daysString} ${hoursString} : ${minutes} : ${seconds}`;

    return (
        <>
            <Typography variant="h6">{t('debug-info', { ns: 'settings' })}</Typography>
            <Stack direction="row" justifyContent="space-between">
                <Typography variant="p">{t('last-block-added-time', { ns: 'settings' })}</Typography>
                <Typography>{displayTime}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="RIGHT" alignItems="center">
                <ConnectionIcon $isConnected={isConnectedToTariNetwork} size={20} />
                <Typography variant="p">
                    {t(isConnectedToTariNetwork ? 'connected-to-tari' : 'not-connected-to-tari', {
                        ns: 'settings',
                    })}
                </Typography>
            </Stack>
        </>
    );
}
