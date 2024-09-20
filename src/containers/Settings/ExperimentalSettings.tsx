import { AnimatePresence } from 'framer-motion';
import { useUIStore } from '@app/store/useUIStore.ts';
import ExperimentalWarning from './sections/experimental/ExperimentalWarning.tsx';
import P2pMarkup from './sections/experimental/P2pMarkup.tsx';
import P2poolStatsMarkup from './sections/experimental/P2poolStatsMarkup.tsx';
import DebugSettings from '@app/containers/Settings/sections/experimental/DebugSettings.tsx';
import AppVersions from '@app/containers/Settings/sections/experimental/AppVersions.tsx';

export const ExperimentalSettings = () => {
    const showExperimental = useUIStore((s) => s.showExperimental);

    return (
        <>
            <ExperimentalWarning />
            {
                <AnimatePresence>
                    {showExperimental && (
                        <>
                            <P2pMarkup />
                            <P2poolStatsMarkup />
                            <DebugSettings />
                            <AppVersions />
                        </>
                    )}
                </AnimatePresence>
            }
        </>
    );
};
