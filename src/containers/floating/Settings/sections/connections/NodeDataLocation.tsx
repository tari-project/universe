import { Activity, ReactNode } from 'react';
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
import { useSetCustomDir } from '@app/hooks/app/useSetCustomDir.ts';

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
    const { t } = useTranslation('settings');
    const { loading, selected, handleSelect, handleSave, handleClear, currentDir } = useSetCustomDir();

    const showCurrent = currentDir?.length && !selected?.length;
    const showSelected = selected?.length && selected !== currentDir;

    const currentMarkup = (
        <Activity mode={showCurrent ? 'visible' : 'hidden'}>
            <SettingsGroup>{!!currentDir && <PathDisplay path={currentDir} />}</SettingsGroup>
        </Activity>
    );

    const selectedMarkup = (
        <Activity mode={showSelected ? 'visible' : 'hidden'}>
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
                    <Button size="xs" onClick={handleSave} disabled={loading}>
                        {loading ? <CircularProgress /> : t('save')}
                    </Button>
                </SettingsGroupAction>
            </SettingsGroup>
        </Activity>
    );

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('node.data-title')}</Typography>
                    </SettingsGroupTitle>
                    <Typography variant="p">{t('node.data-subtitle')} </Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <Button size="xs" onClick={handleSelect} disabled={loading}>
                        {t('node.data-cta')}
                    </Button>
                </SettingsGroupAction>
            </SettingsGroup>
            {currentMarkup}
            {selectedMarkup}
        </SettingsGroupWrapper>
    );
}
