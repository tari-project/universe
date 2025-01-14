import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import { AppContentContainer } from '@app/App/App.styles';
import { useShuttingDown } from '@app/hooks';

import { useAppStateStore } from '@app/store/appStateStore';
import { LazyMotion, domMax, MotionConfig, AnimatePresence } from 'framer-motion';
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
    const isShuttingDown = useShuttingDown();
    const isAppReady = useIsAppReady();
    const isSettingUp = useAppStateStore((s) => s.isSettingUp);

    const showSetup = isSettingUp && !isShuttingDown && isAppReady;

    const setError = useAppStateStore((s) => s.setError);
    const setIsWebglNotSupported = useUIStore((s) => s.setIsWebglNotSupported);
    const { t } = useTranslation('common', { useSuspense: false });

    useEffect(() => {
        if (!window.WebGL2RenderingContext && !window.WebGLRenderingContext) {
            Sentry.captureMessage('WebGL not supported by the browser', { extra: { userAgent: navigator.userAgent } });
            setIsWebglNotSupported(true);
            setError(t('webgl-not-supported'));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const canvasElement = document.getElementById('canvas');
        if (canvasElement) {
            canvasElement.style.opacity = isShuttingDown || isSettingUp ? '0' : '1';
        }
    }, [isShuttingDown, isSettingUp]);

    return (
        <ThemeProvider>
            <GlobalReset />
            <GlobalStyle />
            <LazyMotion features={domMax} strict>
                {/*
                 * added to reduce bundle size
                 * see https://www.framer.com/motion/guide-reduce-bundle-size/#synchronous-loading
                 * strict prop for using `m` instead of `motion`- see https://www.framer.com/motion/guide-reduce-bundle-size/#how-to-reduce-the-size-of-the-motion-component
                 */}
                <MotionConfig reducedMotion="user">
                    <FloatingElements />
                    <AnimatePresence>
                        {!isAppReady && (
                            <AppContentContainer key="splashscreen" initial="visible">
                                <Splashscreen />
                            </AppContentContainer>
                        )}
                        {showSetup && (
                            <AppContentContainer key="setup" initial="visible">
                                <Setup />
                            </AppContentContainer>
                        )}
                        {!isShuttingDown && !isSettingUp && isAppReady && (
                            <AppContentContainer key="main" initial="hidden">
                                <MainView />
                            </AppContentContainer>
                        )}
                        {isShuttingDown && isAppReady && (
                            <AppContentContainer key="shutdown" initial="hidden">
                                <ShuttingDownScreen />
                            </AppContentContainer>
                        )}
                    </AnimatePresence>
                </MotionConfig>
            </LazyMotion>
        </ThemeProvider>
    );
}
