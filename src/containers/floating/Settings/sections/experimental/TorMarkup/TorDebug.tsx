import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';

import { useSetupStore } from '@app/store/useSetupStore.ts';
import { Typography } from '@app/components/elements/Typography';

import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../../components/SettingsGroup.styles.ts';

export const TorDebug = ({ isMac }: { isMac?: boolean }) => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const setupProgress = useSetupStore((s) => s.setupProgress);
    const [entryGuards, setEntryGuards] = useState<string[]>([]);

    useEffect(() => {
        if (!isMac) {
            const fetchEntryGuards = async () => {
                await invoke('get_tor_entry_guards').then((res) => {
                    setEntryGuards(res.filter((e) => e.split(' ')[1] === 'up').map((e) => e.split(' ')[0]));
                });
            };

            if (setupProgress >= 0.5) {
                // Fetch entry guards after the tor is up
                fetchEntryGuards();
            }
        }
    }, [isMac, setupProgress]);

    return (
        <SettingsGroupWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('tor-entry-guards')}</Typography>
            </SettingsGroupTitle>
            <SettingsGroup>
                <SettingsGroupContent style={{ fontSize: '11px' }}>
                    {entryGuards?.length > 0 ? (
                        <ul>
                            {entryGuards.map((eg) => (
                                <li key={eg}>{eg}</li>
                            ))}
                        </ul>
                    ) : (
                        t('no-entry-guard')
                    )}
                </SettingsGroupContent>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
};
