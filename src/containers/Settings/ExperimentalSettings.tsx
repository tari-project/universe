import { useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useUIStore } from '@app/store/useUIStore.ts';
import ExperimentalWarning from './sections/experimental/ExperimentalWarning.tsx';
import P2pMarkup from './sections/experimental/P2pMarkup.tsx';

import DebugSettings from '@app/containers/Settings/sections/experimental/DebugSettings.tsx';
import AppVersions from '@app/containers/Settings/sections/experimental/AppVersions.tsx';
import VisualMode from '@app/containers/Dashboard/components/VisualMode.tsx';
import { SettingsGroup, SettingsGroupWrapper } from '@app/containers/Settings/components/SettingsGroup.styles.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import { useTranslation } from 'react-i18next';
import GpuDevices from './sections/experimental/GpuDevices.tsx';

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
                        {/* <P2poolStatsMarkup /> */}
                        <GpuDevices />
                        <DebugSettings />
                        <AppVersions />
                        <SettingsGroupWrapper>
                            <SettingsGroup>
                                <VisualMode />
                            </SettingsGroup>
                            <SettingsGroup style={{ padding: '0 10px' }}>
                                <ToggleSwitch
                                    label={t('use-tor')}
                                    variant="gradient"
                                    checked={useTor}
                                    onChange={toggleUseTor}
                                />
                            </SettingsGroup>
                        </SettingsGroupWrapper>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
