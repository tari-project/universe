import { AnimatePresence } from 'framer-motion';

import VisualMode from '@app/containers/main/Dashboard/components/VisualMode';
import AppVersions from './AppVersions.tsx';
import DebugSettings from './DebugSettings.tsx';
import ExperimentalWarning from './ExperimentalWarning.tsx';
import { TorMarkup } from './TorMarkup';
import MonerodMarkup from './MonerodMarkup';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';

export const ExperimentalSettings = () => {
    const showExperimental = useAppConfigStore((s) => s.show_experimental_settings);

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
