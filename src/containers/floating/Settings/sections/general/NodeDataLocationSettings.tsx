import { open } from '@tauri-apps/plugin-dialog';
import { useTranslation } from 'react-i18next';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { useState } from 'react';

export default function NodeDataLocationSettings() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const [selectedDir, setSelectedDir] = useState('');

    async function openDialog() {
        const dir = await open({
            multiple: false,
            directory: true,
        });

        if (dir) {
            setSelectedDir(dir);
        }
    }
    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('Node data settings')}</Typography>
                    </SettingsGroupTitle>
                    <Typography variant="p">{t('Set a custom location to store the base node data')}</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <Button onClick={openDialog}>{t('Select directory')}</Button>
                </SettingsGroupAction>
            </SettingsGroup>
            {selectedDir}
        </SettingsGroupWrapper>
    );
}
