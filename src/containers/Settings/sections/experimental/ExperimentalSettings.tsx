import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';

import { useUIStore } from '@app/store/useUIStore.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';

import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import VisualMode from '@app/containers/Dashboard/components/VisualMode.tsx';

import { SettingsGroup, SettingsGroupWrapper } from '../../components/SettingsGroup.styles.ts';

import AppVersions from './AppVersions.tsx';
import DebugSettings from './DebugSettings.tsx';
import ExperimentalWarning from './ExperimentalWarning.tsx';
import GpuDevices from './GpuDevices.tsx';
import P2pMarkup from './P2pMarkup.tsx';

export const ExperimentalSettings = () => {
    const showExperimental = useUIStore((s) => s.showExperimental);
    const useTor = useAppConfigStore((s) => s.use_tor);
    const setUseTor = useAppConfigStore((s) => s.setUseTor);
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);
    const { t } = useTranslation('settings', { useSuspense: false });

    const toggleUseTor = useCallback(() => {
        setUseTor(!useTor).then(() => {
            setDialogToShow('restart');
        });
    }, [setDialogToShow, setUseTor, useTor]);

    return (
        <>
            <ExperimentalWarning />
            <AnimatePresence>
                {showExperimental && (
                    <>
                        <P2pMarkup />
                        <GpuDevices />
                        <DebugSettings />
                        <AppVersions />
                        <SettingsGroupWrapper>
                            <SettingsGroup>
                                <ToggleSwitch
                                    label={t('use-tor')}
                                    variant="gradient"
                                    checked={useTor}
                                    onChange={toggleUseTor}
                                />
                            </SettingsGroup>
                            <SettingsGroup>
                                <VisualMode />
                            </SettingsGroup>
                        </SettingsGroupWrapper>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
