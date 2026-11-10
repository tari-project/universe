import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';

import { Typography } from '@app/components/elements/Typography';

import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../../components/SettingsGroup.styles.ts';
import { useNodeStore } from '@app/store/useNodeStore.ts';

export const TorDebug = () => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const torEntryGuards = useNodeStore((s) => s.tor_entry_guards);

    useEffect(() => {
        invoke('refresh_tor_entry_guards').catch((err) => {
            console.warn('Failed to refresh tor entry guards on mount:', err);
        });
        const interval = setInterval(() => {
            invoke('refresh_tor_entry_guards').catch(() => {});
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    return (
        <SettingsGroupWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('tor-entry-guards')}</Typography>
            </SettingsGroupTitle>
            <SettingsGroup>
                <SettingsGroupContent style={{ fontSize: '11px' }}>
                    {torEntryGuards?.length > 0 ? (
                        <ul>
                            {torEntryGuards.map((eg) => (
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
