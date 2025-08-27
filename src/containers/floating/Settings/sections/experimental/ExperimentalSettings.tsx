import { AnimatePresence } from 'motion/react';

import AppVersions from './AppVersions.tsx';
import DebugSettings from './DebugSettings.tsx';
import ExperimentalWarning from './ExperimentalWarning.tsx';
import { TorMarkup } from './TorMarkup';
import MonerodMarkup from './MonerodMarkup';
import { useConfigUIStore } from '@app/store/useAppConfigStore.ts';

export const ExperimentalSettings = () => {
    const showExperimental = useConfigUIStore((s) => s.show_experimental_settings);

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
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
