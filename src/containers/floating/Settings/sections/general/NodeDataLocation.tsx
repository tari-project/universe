import { ReactNode } from 'react';
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

import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { useSetCustomDirs } from '@app/hooks/app/useSetCustomDirs.ts';
import { CustomDirectory } from '@app/types/configs.ts';

function PathDisplay({ path, action }: { path: string; action?: ReactNode }) {
    return (
        <SettingsGroupContent>
            <SelectedDirectoryWrapper>
                <DirectoryTextWrapper>
                    <Typography>
                        <strong>{`Selected: `}</strong>
                        {path}
                    </Typography>
                </DirectoryTextWrapper>
                {action}
            </SelectedDirectoryWrapper>
        </SettingsGroupContent>
    );
}

export default function NodeDataLocationSettings() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const { loading, selected, handleSelect, handleSave, handleClear, currentDir } = useSetCustomDirs({
        type: CustomDirectory.ChainData,
    });

    const showSelected = selected?.length && selected !== currentDir;

    const currentMarkup =
        currentDir?.length && !selected?.length ? (
            <SettingsGroup>
                <PathDisplay path={currentDir} />
            </SettingsGroup>
        ) : null;

    const selectedMarkup = showSelected ? (
        <SettingsGroup>
            <PathDisplay
                path={selected}
                action={
                    <RemoveCTA onClick={handleClear}>
                        <FaDeleteLeft size={14} />
                    </RemoveCTA>
                }
            />
            <SettingsGroupAction>
                <Button size="xs" onClick={handleSave}>
                    {loading ? <CircularProgress /> : t('Save')}
                </Button>
            </SettingsGroupAction>
        </SettingsGroup>
    ) : null;

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('Node data settings')}</Typography>
                    </SettingsGroupTitle>
                    <Typography variant="p">{t('Set a custom location to store the base node data')} </Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <Button size="xs" onClick={handleSelect}>
                        {t('Change directory')}
                    </Button>
                </SettingsGroupAction>
            </SettingsGroup>
            {currentMarkup}
            {selectedMarkup}
        </SettingsGroupWrapper>
    );
}
