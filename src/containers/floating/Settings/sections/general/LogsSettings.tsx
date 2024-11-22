import { Typography } from '@app/components/elements/Typography.tsx';
import { Trans, useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/tauri';
import { useState } from 'react';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { SendLogsDialog } from '@app/components/dialogs/SendLogsDialog.tsx';
import { useUIStore } from '@app/store/useUIStore.ts';

import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';
import { Stack } from '@app/components/elements/Stack.tsx';

import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';

export default function LogsSettings() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);
    const { isCopied, copyToClipboard } = useCopyToClipboard();

    const [reference, setReference] = useState('');

    const openLogsDirectory = () => {
        invoke('open_log_dir')
            .then(() => {
                console.info('Opening logs directory');
            })
            .catch((error) => {
                console.error('Error opening logs directory: ', error);
            });
    };

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('report-issue', { ns: 'settings' })}</Typography>
                    </SettingsGroupTitle>
                    {reference && (
                        <Stack direction="row" alignItems="center" justifyContent="flex-start" gap={5}>
                            {/* TODO: consider moving reference to dialog?*/}
                            <Typography>
                                <Trans
                                    t={t}
                                    i18nKey="your-reference"
                                    ns="settings"
                                    values={{ logRef: reference }}
                                    components={{ bold: <strong />, br: <br /> }}
                                />
                            </Typography>
                            <IconButton onClick={() => copyToClipboard(reference)} size="small">
                                {!isCopied ? <IoCopyOutline /> : <IoCheckmarkOutline />}
                            </IconButton>
                        </Stack>
                    )}
                </SettingsGroupContent>

                <SettingsGroupAction>
                    <Button onClick={openLogsDirectory}>{t('open-logs-directory', { ns: 'settings' })}</Button>
                    <Button onClick={() => setDialogToShow('logs')}>{t('send-logs', { ns: 'settings' })}</Button>
                </SettingsGroupAction>
                <SendLogsDialog onSetReference={setReference} />
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
