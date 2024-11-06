import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/tauri';

import { Typography } from '@app/components/elements/Typography';
import { useAppStateStore } from '@app/store/appStateStore';

import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../../components/SettingsGroup.styles.ts';

export const TorDebug = () => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const setupProgress = useAppStateStore((s) => s.setupProgress);
    const [entryGuards, setEntryGuards] = useState<string[]>([]);

    useEffect(() => {
        const fetchEntryGuards = async () => {
            await invoke('get_tor_entry_guards').then((res) => {
                setEntryGuards(res.filter((e) => e.split(' ')[1] === 'up').map((e) => e.split(' ')[0]));
            });
        };

        if (setupProgress >= 0.5) {
            // Fetch entry guards after the tor is up
            fetchEntryGuards();
        }
    });

    return (
        <SettingsGroupWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('tor-entry-guards')}</Typography>
            </SettingsGroupTitle>
            <SettingsGroup>
                <SettingsGroupContent style={{ fontSize: '11px' }}>
                    <ul>
                        {entryGuards?.length > 0
                            ? entryGuards.map((eg) => <li key={eg}>{eg}</li>)
                            : t('no-entry-guard')}
                    </ul>
                </SettingsGroupContent>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
};
