import { LayoutGroup, LazyMotion, domMax, MotionConfig } from 'framer-motion';
import { DashboardContainer } from './theme/styles';
import { SideBar } from './containers/SideBar';
import { Dashboard } from './containers/Dashboard';

import { useUIStore } from './store/useUIStore.ts';

import { SplashScreen } from './containers/SplashScreen';
import ThemeProvider from './theme/ThemeProvider.tsx';
import { GlobalReset, GlobalStyle } from '@app/theme/GlobalStyle.ts';
import ErrorSnackbar from '@app/containers/Error/ErrorSnackbar.tsx';
import { useShuttingDown } from './hooks/useShuttingDown.ts';
import ShuttingDownScreen from './containers/ShuttingDownScreen/ShuttingDownScreen.tsx';
import AutoUpdateDialog from './containers/AutoUpdateDialog/AutoUpdateDialog.tsx';

import { useMemo } from 'react';
import CriticalErrorDialog from './containers/CriticalErrorDialog/CriticalErrorDialog.tsx';
import SettingsModal from '@app/containers/Settings/SettingsModal.tsx';
import { ExternalDependenciesDialog } from './containers/ExternalDependenciesDialog/ExternalDependenciesDialog.tsx';
import { GlobalFontFace } from '@app/theme/fonts/GlobalFontFaces.ts';
import StagedSecurity from './containers/StagedSecurity/StagedSecurity.tsx';
import PaperWalletModal from './containers/PaperWalletModal/PaperWalletModal.tsx';
import { FloatingTree } from '@floating-ui/react';
import ShareRewardModal from './containers/ShareRewardModal/ShareRewardModal.tsx';

export default function App() {
    const isShuttingDown = useShuttingDown();
    const showSplash = useUIStore((s) => s.showSplash);
    const view = useUIStore((s) => s.view);
    const visualMode = useUIStore((s) => s.visualMode);

    const shutDownMarkup = useMemo(() => {
        return isShuttingDown ? <ShuttingDownScreen /> : null;
    }, [isShuttingDown]);
    const mainMarkup = useMemo(() => {
        if (!isShuttingDown && !showSplash) {
            return (
                <DashboardContainer $view={view} $visualModeOff={!visualMode}>
                    <SideBar />
                    <Dashboard status={view} />
                </DashboardContainer>
            );
        } else {
            return null;
        }
    }, [isShuttingDown, showSplash, view, visualMode]);

    return (
        <ThemeProvider>
            <GlobalReset />
            <GlobalFontFace />
            <GlobalStyle />
            <LazyMotion features={domMax} strict>
                {/*
                 * added to reduce bundle size
                 * see https://www.framer.com/motion/guide-reduce-bundle-size/#synchronous-loading
                 * strict prop for using `m` instead of `motion`- see https://www.framer.com/motion/guide-reduce-bundle-size/#how-to-reduce-the-size-of-the-motion-component
                 */}
                <MotionConfig reducedMotion="user">
                    <FloatingTree>
                        {/*dialogs*/}
                        <SettingsModal />
                        <StagedSecurity />
                        <AutoUpdateDialog />
                        <CriticalErrorDialog />
                        <ExternalDependenciesDialog />
                        <PaperWalletModal />
                        <ErrorSnackbar />
                        <ShareRewardModal />
                        {/*dialogs end*/}
                        <LayoutGroup id="app-content">
                            {shutDownMarkup}
                            {mainMarkup}
                            <SplashScreen />
                        </LayoutGroup>
                    </FloatingTree>
                </MotionConfig>
            </LazyMotion>
        </ThemeProvider>
    );
}
