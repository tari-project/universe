import { AnimatePresence } from 'framer-motion';

import VisualMode from '@app/containers/main/Dashboard/components/VisualMode';
import AppVersions from './AppVersions.tsx';
import DebugSettings from './DebugSettings.tsx';
import ExperimentalWarning from './ExperimentalWarning.tsx';
import { TorMarkup } from './TorMarkup';
import MonerodMarkup from './MonerodMarkup';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';
import P2poolMarkup from './P2poolMarkup.tsx';

export const ExperimentalSettings = () => {
    const showExperimental = useAppConfigStore((s) => s.show_experimental_settings);
    const isP2poolEnabled = useAppConfigStore((s) => s.p2pool_enabled);

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
                        <VisualMode />
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
