import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
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

export default function LogsSettings() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const setShowLogsDialog = useUIStore((s) => s.setShowLogsDialog);

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
                    {reference && <p>{`${t('your-reference', { ns: 'settings' })}: ${reference}`}</p>}
                </SettingsGroupContent>

                <SettingsGroupAction>
                    <ButtonBase onClick={openLogsDirectory}>{t('open-logs-directory', { ns: 'settings' })}</ButtonBase>
                    <ButtonBase onClick={() => setShowLogsDialog(true)}>
                        {t('send-logs', { ns: 'settings' })}
                    </ButtonBase>
                </SettingsGroupAction>
            </SettingsGroup>
            <SendLogsDialog onSetReference={setReference} />
        </SettingsGroupWrapper>
    );
}
