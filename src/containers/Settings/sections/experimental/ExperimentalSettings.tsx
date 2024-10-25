import { AnimatePresence } from 'framer-motion';
import { useUIStore } from '@app/store/useUIStore.ts';

import VisualMode from '@app/containers/Dashboard/components/VisualMode.tsx';

import AppVersions from './AppVersions.tsx';
import DebugSettings from './DebugSettings.tsx';
import ExperimentalWarning from './ExperimentalWarning.tsx';
import { TorMarkup } from './TorMarkup';
import { SettingsGroup, SettingsGroupAction } from '../../components/SettingsGroup.styles.ts';

export const ExperimentalSettings = () => {
    const showExperimental = useUIStore((s) => s.showExperimental);

    return (
        <>
            <ExperimentalWarning />
            <AnimatePresence>
                {showExperimental && (
                    <>
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
