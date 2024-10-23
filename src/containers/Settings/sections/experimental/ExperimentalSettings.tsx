import { AnimatePresence } from 'framer-motion';
import { useUIStore } from '@app/store/useUIStore.ts';
import VisualMode from '@app/containers/Dashboard/components/VisualMode.tsx';
import { SettingsGroup, SettingsGroupAction } from '../../components/SettingsGroup.styles.ts';

import AppVersions from './AppVersions.tsx';
import DebugSettings from './DebugSettings.tsx';
import ExperimentalWarning from './ExperimentalWarning.tsx';
import GpuDevices from './GpuDevices.tsx';

import { TorMarkup } from './TorMarkup';

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
