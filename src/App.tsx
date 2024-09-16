import { LayoutGroup, LazyMotion, domMax, MotionConfig } from 'framer-motion';
import { BackgroundImage, DashboardContainer } from './theme/styles';
import { SideBar } from './containers/SideBar';
import { Dashboard } from './containers/Dashboard';

import { useUIStore } from './store/useUIStore.ts';
import { useGetStatus } from './hooks/useGetStatus.ts';
import { useSetUp } from './hooks/useSetUp.ts';
import { useEnvironment } from './hooks/useEnvironment.ts';
import { SplashScreen } from './containers/SplashScreen';
import ThemeProvider from './theme/ThemeProvider.tsx';
import { GlobalReset, GlobalStyle } from '@app/theme/GlobalStyle.ts';
import { useAirdropSyncState } from './hooks/airdrop/useAirdropSyncState.ts';
import AirdropLogin from './containers/Airdrop/AirdropLogin/AirdropLogin.tsx';
import ErrorSnackbar from '@app/containers/Error/ErrorSnackbar.tsx';
import { useShuttingDown } from './hooks/useShuttingDown.ts';
import ShuttingDownScreen from './containers/ShuttingDownScreen/ShuttingDownScreen.tsx';
import AutoUpdateDialog from './containers/AutoUpdateDialog/AutoUpdateDialog.tsx';
import useMining from '@app/hooks/mining/useMining.ts';

import { useUiMiningStateMachine } from './hooks/mining/useMiningUiStateMachine.ts';

export default function App() {
    useAirdropSyncState();
    useSetUp();
    useMining();
    useGetStatus();
    useEnvironment();
    useUiMiningStateMachine();

    const isShuttingDown = useShuttingDown();
    const showSplash = useUIStore((s) => s.showSplash);
    const view = useUIStore((s) => s.view);
    const visualMode = useUIStore((s) => s.visualMode);

    const canRenderMain = !isShuttingDown && !showSplash;
    const splashScreenMarkup = <SplashScreen />;
    const shutDownMarkup = isShuttingDown ? <ShuttingDownScreen /> : null;
    const mainMarkup = canRenderMain ? (
        <DashboardContainer>
            <SideBar />
            <Dashboard status={view} />
        </DashboardContainer>
    ) : null;

    return (
        <ThemeProvider>
            <GlobalReset />
            <GlobalStyle />
            <AutoUpdateDialog />
            <LazyMotion features={domMax} strict>
                {/*
                 * added to reduce bundle size
                 * see https://www.framer.com/motion/guide-reduce-bundle-size/#synchronous-loading
                 * strict prop for using `m` instead of `motion`- see https://www.framer.com/motion/guide-reduce-bundle-size/#how-to-reduce-the-size-of-the-motion-component
                 */}
                <MotionConfig reducedMotion="user">
                    <LayoutGroup id="app-content">
                        <AirdropLogin />
                        {splashScreenMarkup}
                        {shutDownMarkup}
                        {!visualMode || view != 'mining' ? (
                            <BackgroundImage layout transition={{ duration: 0.3 }} />
                        ) : null}
                        {mainMarkup}
                        <ErrorSnackbar />
                    </LayoutGroup>
                </MotionConfig>
            </LazyMotion>
        </ThemeProvider>
    );
}
