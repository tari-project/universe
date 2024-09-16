import { Typography } from '@app/components/elements/Typography.tsx';
import { Button } from '@app/components/elements/Button.tsx';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/tauri';
import { Stack } from '@app/components/elements/Stack.tsx';

export default function LogsSettings() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });

    const openLogsDirectory = () => {
        invoke('open_log_dir')
            .then(() => {
                console.info('Opening logs directory');
            })
            .catch((error) => {
                console.error(error);
            });
    };

    return (
        <Stack direction="row" justifyContent="space-between">
            <Typography variant="h6">{t('logs', { ns: 'settings' })}</Typography>
            <Button onClick={openLogsDirectory} variant="text" styleVariant="simple">
                {t('open-logs-directory', { ns: 'settings' })}
            </Button>
        </Stack>
    );
}
