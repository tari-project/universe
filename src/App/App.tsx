import { useEffect } from 'react';
import { AppContentContainer } from '@app/App/App.styles';
import { useShuttingDown } from '@app/hooks';

import { useAppStateStore } from '@app/store/appStateStore';
import { LazyMotion, domAnimation, AnimatePresence } from 'motion/react';
import { useUIStore } from '@app/store/useUIStore.ts';
import { useTranslation } from 'react-i18next';

import ShuttingDownScreen from '../containers/phase/ShuttingDownScreen/ShuttingDownScreen.tsx';
import FloatingElements from '../containers/floating/FloatingElements.tsx';
import MainView from '../containers/main/MainView.tsx';
import Setup from '../containers/phase/Setup/Setup';

import { GlobalReset, GlobalStyle } from '../theme/GlobalStyle.ts';
import ThemeProvider from '../theme/ThemeProvider.tsx';
import { useIsAppReady } from '@app/hooks/app/isAppReady.ts';
import Splashscreen from '@app/containers/phase/Splashscreen/Splashscreen.tsx';

export default function App() {
    const isAppReady = useIsAppReady();
    const isShuttingDown = useShuttingDown();
    const isSettingUp = useAppStateStore((s) => !s.setupComplete);
    const setError = useAppStateStore((s) => s.setError);
    const setIsWebglNotSupported = useUIStore((s) => s.setIsWebglNotSupported);
    const { t } = useTranslation('common', { useSuspense: false });

    useEffect(() => {
        if (!window.WebGL2RenderingContext && !window.WebGLRenderingContext) {
            console.error('WebGL not supported by the browser.', 'userAgent:', navigator.userAgent);
            setIsWebglNotSupported(true);
            setError(t('webgl-not-supported'));
        }
    }, [setError, setIsWebglNotSupported, t]);

    const showSetup = isSettingUp && !isShuttingDown && isAppReady;
    const showMainView = !isSettingUp && !isShuttingDown && isAppReady;
    return (
        <ThemeProvider>
            <GlobalReset />
            <GlobalStyle />
            <LazyMotion features={domAnimation} strict>
                {/*
                 * added to reduce bundle size
                 * see https://www.framer.com/motion/guide-reduce-bundle-size/#synchronous-loading
                 * strict prop for using `m` instead of `motion`- see https://www.framer.com/motion/guide-reduce-bundle-size/#how-to-reduce-the-size-of-the-motion-component
                 */}
                <FloatingElements />
                <AnimatePresence mode="popLayout">
                    {!isAppReady ? (
                        <AppContentContainer key="splashscreen" initial="hidden">
                            <Splashscreen />
                        </AppContentContainer>
                    ) : null}

                    {showSetup ? (
                        <AppContentContainer key="setup" initial="hidden">
                            <Setup />
                        </AppContentContainer>
                    ) : null}

                    {showMainView ? (
                        <AppContentContainer key="main" initial="dashboardInitial">
                            <MainView />
                        </AppContentContainer>
                    ) : null}

                    {isShuttingDown && isAppReady ? (
                        <AppContentContainer key="shutdown" initial="hidden">
                            <ShuttingDownScreen />
                        </AppContentContainer>
                    ) : null}
                </AnimatePresence>
            </LazyMotion>
        </ThemeProvider>
    );
}
