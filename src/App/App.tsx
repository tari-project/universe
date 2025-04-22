import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LazyMotion, domAnimation, AnimatePresence } from 'motion/react';

import { PortalSdkProvider, useShuttingDown } from '../hooks';

import { setError, setIsWebglNotSupported } from '../store/actions';
import { GlobalReset, GlobalStyle } from '../theme/GlobalStyle.ts';
import ThemeProvider from '../theme/ThemeProvider.tsx';
import Splashscreen from '../containers/phase/Splashscreen/Splashscreen.tsx';
import ShuttingDownScreen from '../containers/phase/ShuttingDownScreen/ShuttingDownScreen.tsx';
import FloatingElements from '../containers/floating/FloatingElements.tsx';
import MainView from '../containers/main/MainView.tsx';

import { AppContentContainer } from './App.styles.ts';
import { useUIStore } from '@app/store/useUIStore.ts';
import { TOWER_CANVAS_ID } from '@app/store';

interface CurrentAppSectionProps {
    showSplashscreen?: boolean;
    isShuttingDown?: boolean;
}
function CurrentAppSection({ showSplashscreen, isShuttingDown }: CurrentAppSectionProps) {
    const currentSection = useMemo(() => {
        const showMainView = !isShuttingDown && !showSplashscreen;

        if (showSplashscreen) {
            return (
                <AppContentContainer key="splashscreen" initial="hidden">
                    <Splashscreen />
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
        return null;
    }, [showSplashscreen, isShuttingDown]);

    return <AnimatePresence mode="wait">{currentSection}</AnimatePresence>;
}

export default function App() {
    const isShuttingDown = useShuttingDown();
    const showSplashscreen = useUIStore((s) => s.showSplashscreen);
    const { t } = useTranslation('common', { useSuspense: false });
    if (!window.WebGL2RenderingContext && !window.WebGLRenderingContext) {
        console.error(`WebGL not supported by the browser - userAgent: ${navigator.userAgent}`);
        setIsWebglNotSupported(true);
        setError(t('webgl-not-supported'));
    }

    return (
        <ThemeProvider>
            <PortalSdkProvider>
                <GlobalReset />
                <GlobalStyle $hideCanvas={showSplashscreen || isShuttingDown} />
                <LazyMotion features={domAnimation} strict>
                    <FloatingElements />
                    <CurrentAppSection showSplashscreen={showSplashscreen} isShuttingDown={isShuttingDown} />
                </LazyMotion>
                <canvas id={TOWER_CANVAS_ID} />
            </PortalSdkProvider>
        </ThemeProvider>
    );
}
