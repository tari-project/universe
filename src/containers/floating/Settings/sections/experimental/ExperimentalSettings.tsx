import { AnimatePresence } from 'framer-motion';

import { useUIStore } from '@app/store/useUIStore.ts';
import VisualMode from '@app/containers/main/Dashboard/components/VisualMode';
import AppVersions from './AppVersions.tsx';
import DebugSettings from './DebugSettings.tsx';
import ExperimentalWarning from './ExperimentalWarning.tsx';
import { TorMarkup } from './TorMarkup';
import MonerodMarkup from './MonerodMarkup';

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
                        <MonerodMarkup />
                        <br />
                        <VisualMode />
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
