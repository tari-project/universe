import { useState, useTransition } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';

import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';
import { FaDeleteLeft } from 'react-icons/fa6';
import { DirectoryTextWrapper, RemoveCTA, SelectedDirectoryWrapper } from './styles.ts';
import { invoke } from '@tauri-apps/api/core';
import { CustomDirectory } from '@app/types/configs.ts';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';

export default function NodeDataLocationSettings() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const [isPending, startTransition] = useTransition();
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

    function handleSave() {
        startTransition(async () => {
            await invoke('set_custom_directory', { directoryType: CustomDirectory.ChainData, path: selectedDir }).then(
                () => setSelectedDir('')
            );
        });
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
                    <Button size="xs" onClick={openDialog}>
                        {t('Select directory')}
                    </Button>
                </SettingsGroupAction>
            </SettingsGroup>
            {selectedDir?.length ? (
                <SettingsGroup>
                    <SettingsGroupContent>
                        <SelectedDirectoryWrapper>
                            <DirectoryTextWrapper>
                                <Typography>
                                    <strong>{`Selected: `}</strong>
                                    {selectedDir}
                                </Typography>
                            </DirectoryTextWrapper>
                            <RemoveCTA onClick={() => setSelectedDir('')}>
                                <FaDeleteLeft size={14} />
                            </RemoveCTA>
                        </SelectedDirectoryWrapper>
                    </SettingsGroupContent>
                    <SettingsGroupAction>
                        <Button size="xs" onClick={handleSave}>
                            {isPending ? <CircularProgress /> : t('Save')}
                        </Button>
                    </SettingsGroupAction>
                </SettingsGroup>
            ) : null}
        </SettingsGroupWrapper>
    );
}
