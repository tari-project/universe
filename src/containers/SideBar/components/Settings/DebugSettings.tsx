import { Typography } from '@app/components/elements/Typography.tsx';
import { Button } from '@app/components/elements/Button.tsx';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/tauri';
import calculateTimeSince from '@app/utils/calculateTimeSince.ts';
import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import { Stack } from '@app/components/elements/Stack.tsx';

export default function DebugSettings() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });

    const blockTime = useAppStatusStore((state) => state.base_node?.block_time);

    const now = new Date();
    const lastBlockTime = calculateTimeSince(blockTime || 0, now.getTime());
    const { daysString, hoursString, minutes, seconds } = lastBlockTime || {};
    const displayTime = `${daysString} ${hoursString} : ${minutes} : ${seconds}`;

    const openLogsDirectory = () => {
        invoke('open_log_dir')
            .then(() => {
                console.info('Opening logs directory');
            })
            .catch((error) => {
                console.error(error);
            });
    };

    const logMarkup = (
        <Stack direction="row" justifyContent="space-between">
            <Typography variant="p">{t('logs', { ns: 'settings' })}</Typography>
            <Button onClick={openLogsDirectory} variant="text" styleVariant="simple">
                {t('open-logs-directory', { ns: 'settings' })}
            </Button>
        </Stack>
    );
    const debugMarkup = (
        <>
            <Stack direction="row" justifyContent="space-between">
                <Typography variant="p">{t('last-block-added-time', { ns: 'settings' })}</Typography>
                <Typography>{displayTime}</Typography>
            </Stack>
        </>
    );
    return (
        <>
            <Typography variant="h6">{t('debug-info', { ns: 'settings' })}:</Typography>
            {debugMarkup}
            {logMarkup}
        </>
    );
}
