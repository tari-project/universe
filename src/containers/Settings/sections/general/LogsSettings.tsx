import { Typography } from '@app/components/elements/Typography.tsx';
import { Button } from '@app/components/elements/Button.tsx';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/tauri';
import { Stack } from '@app/components/elements/Stack.tsx';
import { useCallback, useState } from 'react';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/Settings/components/SettingsGroup.styles.ts';
import { ButtonBase } from '@app/components/elements/buttons/ButtonBase.tsx';

export default function LogsSettings() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [error, setError] = useState('');
    const sendLogs = useCallback(() => {
        setLoading(true);
        setError('');
        if (!feedback) {
            setError(t('feedback-required', { ns: 'settings' }));
            setLoading(false);
            return;
        }
        invoke('send_feedback', { feedback, includeLogs: true })
            .then(() => {
                setOpen(false);
            })
            .catch((error) => {
                setError(error.toString());
            })
            .finally(() => {
                setLoading(false);
            });
    }, [feedback]);
    const openLogsDirectory = () => {
        invoke('open_log_dir')
            .then(() => {
                console.info('Opening logs directory');
            })
            .catch((error) => {
                console.error(error);
            });
    };

    const handleClose = useCallback(() => {
        setOpen(false);
    }, [setOpen]);

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('logs', { ns: 'settings' })}</Typography>
                    </SettingsGroupTitle>
                </SettingsGroupContent>

                <SettingsGroupAction>
                    <ButtonBase onClick={openLogsDirectory}>{t('open-logs-directory', { ns: 'settings' })}</ButtonBase>
                    <ButtonBase onClick={() => setOpen(true)}>{t('send-logs', { ns: 'settings' })}</ButtonBase>
                </SettingsGroupAction>
            </SettingsGroup>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <Stack direction="column" alignItems="center" justifyContent="space-between">
                        <Typography variant="h3">{t('send-logs', { ns: 'settings' })}</Typography>
                        <textarea
                            onChange={(e) => setFeedback(e.target.value)}
                            style={{ width: '500px', height: '500px' }}
                            placeholder={t('your-feedback', { ns: 'settings' })}
                        />
                        <Typography variant={'p'} color={'red'}>
                            {error}
                        </Typography>
                        <Stack direction="row">
                            {loading ? (
                                <CircularProgress />
                            ) : (
                                <>
                                    <Button disabled={loading} onClick={handleClose} color="warning">
                                        {t('cancel')}
                                    </Button>
                                    <Button disabled={loading || feedback.trim() === ''} onClick={sendLogs}>
                                        {t('submit')}
                                    </Button>
                                </>
                            )}
                        </Stack>
                    </Stack>
                </DialogContent>
            </Dialog>
        </SettingsGroupWrapper>
    );
}
