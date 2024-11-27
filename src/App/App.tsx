import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import { useShuttingDown } from '@app/hooks/useShuttingDown';
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

import AppContent from './AppContent';
import { AppContentContainer } from './App.styles';

export default function App() {
    const isShuttingDown = useShuttingDown();
    const isSettingUp = useAppStateStore((s) => s.isSettingUp);
    const setError = useAppStateStore((s) => s.setError);
    const setIsWebglNotSupported = useUIStore((s) => s.setIsWebglNotSupported);
    const adminShow = useUIStore((s) => s.adminShow);
    const { t } = useTranslation('common', { useSuspense: false });

    useEffect(() => {
        if (!window.WebGL2RenderingContext && !window.WebGLRenderingContext) {
            Sentry.captureMessage('WebGL not supported by the browser', { extra: { userAgent: navigator.userAgent } });
            setIsWebglNotSupported(true);
            setError(t('webgl-not-supported'));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showMain = !isSettingUp && adminShow !== 'setup' && !isSettingUp;

    useEffect(() => {
        const canvasElement = document.getElementById('canvas');
        if (canvasElement) {
            canvasElement.style.opacity = showMain ? '1' : '0';
        }
    }, [showMain]);

    const setupMarkup =
        !isShuttingDown && (isSettingUp || adminShow === 'setup') ? (
            <AppContentContainer key="setup" initial="entered">
                <Setup />
            </AppContentContainer>
        ) : null;

    const shutdownMarkup = isShuttingDown ? (
        <AppContentContainer key="shutdown" initial="hidden">
            <ShuttingDownScreen />
        </AppContentContainer>
    ) : null;

    const mainMarkup = showMain ? (
        <AppContentContainer key="main" initial="hidden">
            <MainView />
        </AppContentContainer>
    ) : null;

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
                    <AppContent key="app-content">
                        <AnimatePresence>
                            {setupMarkup}
                            {mainMarkup}
                            {shutdownMarkup}
                        </AnimatePresence>
                    </AppContent>
                </MotionConfig>
            </LazyMotion>
        </ThemeProvider>
    );
}
