import { AnimatePresence } from 'framer-motion';
import { useUIStore } from '@app/store/useUIStore.ts';
import ExperimentalWarning from './sections/experimental/ExperimentalWarning.tsx';
import DebugSettings from '@app/containers/Settings/sections/experimental/DebugSettings.tsx';
import AppVersions from '@app/containers/Settings/sections/experimental/AppVersions.tsx';
import VisualMode from '@app/containers/Dashboard/components/VisualMode.tsx';
import { SettingsGroup, SettingsGroupAction } from '@app/containers/Settings/components/SettingsGroup.styles.ts';
import GpuDevices from './sections/experimental/GpuDevices.tsx';
import { TorMarkup } from './sections/experimental/TorMarkup';

export const ExperimentalSettings = () => {
    const showExperimental = useUIStore((s) => s.showExperimental);

    return (
        <>
            <ExperimentalWarning />
            <AnimatePresence>
                {showExperimental && (
                    <>
                        <GpuDevices />
                        <DebugSettings />
                        <AppVersions />
                        <TorMarkup />
                        <br />
                        <SettingsGroup>
                            <div />
                            <SettingsGroupAction>
                                <VisualMode />
                            </SettingsGroupAction>
                        </SettingsGroup>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
