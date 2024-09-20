import { AnimatePresence } from 'framer-motion';
import { useUIStore } from '@app/store/useUIStore.ts';
import ExperimentalWarning from './sections/experimental/ExperimentalWarning.tsx';
import P2pMarkup from './sections/experimental/P2pMarkup.tsx';
import P2poolStatsMarkup from './sections/experimental/P2poolStatsMarkup.tsx';
import DebugSettings from '@app/containers/Settings/sections/experimental/DebugSettings.tsx';
import AppVersions from '@app/containers/Settings/sections/experimental/AppVersions.tsx';
import VisualMode from '@app/containers/Dashboard/components/VisualMode.tsx';
import { SettingsGroup, SettingsGroupWrapper } from '@app/containers/Settings/components/SettingsGroup.styles.ts';
import { ToggleAirdropUi } from '@app/containers/Airdrop/Settings/ToggleAirdropUi.tsx';

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
                            <SettingsGroupWrapper>
                                <SettingsGroup>
                                    <VisualMode />
                                    <ToggleAirdropUi />
                                </SettingsGroup>
                            </SettingsGroupWrapper>
                        </>
                    )}
                </AnimatePresence>
            }
        </>
    );
};
