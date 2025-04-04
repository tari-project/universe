import { AnimatePresence } from 'motion/react';

import AppVersions from './AppVersions.tsx';
import DebugSettings from './DebugSettings.tsx';
import ExperimentalWarning from './ExperimentalWarning.tsx';
import { TorMarkup } from './TorMarkup';
import MonerodMarkup from './MonerodMarkup';
import P2poolMarkup from './P2poolMarkup.tsx';
import { useConfigCoreStore, useConfigUIStore } from '@app/store/useAppConfigStore.ts';

export const ExperimentalSettings = () => {
    const showExperimental = useConfigUIStore((s) => s.show_experimental_settings);
    const isP2poolEnabled = useConfigCoreStore((s) => s.is_p2pool_enabled);

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
                        {isP2poolEnabled && <P2poolMarkup />}
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
