import * as Sentry from '@sentry/react';
import { memo, useMemo } from 'react';
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

const CurrentAppSection = memo(function CurrentAppSection() {
    const isAppReady = useIsAppReady();
    const isShuttingDown = useShuttingDown();
    const isSettingUp = useAppStateStore((s) => !s.setupComplete);

    const currentSection = useMemo(() => {
        const showSetup = isSettingUp && !isShuttingDown && isAppReady;
        const showMainView = !isSettingUp && !isShuttingDown && isAppReady;
        if (!isAppReady) {
            return (
                <AppContentContainer key="splashscreen" initial="hidden">
                    <Splashscreen />
                </AppContentContainer>
            );
        }

        if (showSetup) {
            return (
                <AppContentContainer key="setup" initial="hidden">
                    <Setup />
                </AppContentContainer>
            );
        }

        if (showMainView) {
            return (
                <AppContentContainer key="main" initial="dashboardInitial">
                    <MainView />
                </AppContentContainer>
            );
        }

        if (isShuttingDown) {
            return (
                <AppContentContainer key="shutdown" initial="hidden">
                    <ShuttingDownScreen />
                </AppContentContainer>
            );
        }
    }, [isAppReady, isSettingUp, isShuttingDown]);

    return <AnimatePresence mode="popLayout">{currentSection}</AnimatePresence>;
});

export default function App() {
    const setError = useAppStateStore((s) => s.setError);
    const setIsWebglNotSupported = useUIStore((s) => s.setIsWebglNotSupported);

    const { t } = useTranslation('common', { useSuspense: false });

    if (!window.WebGL2RenderingContext && !window.WebGLRenderingContext) {
        Sentry.captureMessage('WebGL not supported by the browser', { extra: { userAgent: navigator.userAgent } });
        setIsWebglNotSupported(true);
        setError(t('webgl-not-supported'));
    }
    return (
        <ThemeProvider>
            <GlobalReset />
            <GlobalStyle />
            <LazyMotion features={domAnimation} strict>
                <FloatingElements />
                <CurrentAppSection />
            </LazyMotion>
        </ThemeProvider>
    );
}
