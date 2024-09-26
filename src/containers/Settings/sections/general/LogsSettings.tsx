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
} from '@app/containers/Settings/components/SettingsGroup.styles.ts';
import { ButtonBase } from '@app/components/elements/buttons/ButtonBase.tsx';
import { SendLogsDialog } from '@app/components/feedback/SendLogsDialog.tsx';
import { useUIStore } from '@app/store/useUIStore.ts';

import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';
import { Stack } from '@app/components/elements/Stack.tsx';
import { IconButton } from '@app/components/elements/Button.tsx';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';

export default function LogsSettings() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const setShowLogsDialog = useUIStore((s) => s.setShowLogsDialog);
    const { isCopied, copyToClipboard } = useCopyToClipboard();

    const [reference, setReference] = useState('');

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
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('logs', { ns: 'settings' })}</Typography>
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
                    <ButtonBase onClick={openLogsDirectory}>{t('open-logs-directory', { ns: 'settings' })}</ButtonBase>
                    <ButtonBase onClick={() => setShowLogsDialog(true)}>
                        {t('send-logs', { ns: 'settings' })}
                    </ButtonBase>
                </SettingsGroupAction>
                <SendLogsDialog onSetReference={setReference} />
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
