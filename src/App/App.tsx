import { lazy, Suspense, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LazyMotion, domMax, AnimatePresence } from 'motion/react';
import { QueryClientProvider } from '@tanstack/react-query';

import { setError, setIsWebglNotSupported } from '../store/actions';
import { GlobalReset, GlobalStyle } from '../theme/GlobalStyle.ts';
import ThemeProvider from '../theme/ThemeProvider.tsx';

import { AppContentContainer } from './App.styles.ts';
import { useUIStore } from '@app/store/useUIStore.ts';
import { queryClient } from './queryClient.ts';
import { useWindowVisibility } from '@app/hooks/app/useWindowVisibility.ts';
import { useTowerCanvasPause } from '@app/hooks/app/useTowerCanvasPause.ts';

import Splashscreen from '../containers/phase/Splashscreen/Splashscreen.tsx';

const ShuttingDownScreen = lazy(() => import('../containers/phase/ShuttingDownScreen/ShuttingDownScreen.tsx'));
const FloatingElements = lazy(() => import('../containers/floating/FloatingElements.tsx'));
const MainView = lazy(() => import('../containers/main/MainView.tsx'));

interface CurrentAppSectionProps {
    showSplashscreen?: boolean;
    isShuttingDown?: boolean;
}

function CurrentAppSection({ showSplashscreen, isShuttingDown }: CurrentAppSectionProps) {
    const currentSection = useMemo(() => {
        const showMainView = !isShuttingDown && !showSplashscreen;

        if (showMainView) {
            return (
                <AppContentContainer key="main" initial="hidden">
                    <Suspense fallback={<div />}>
                        <MainView />
                    </Suspense>
                </AppContentContainer>
            );
        }

        if (isShuttingDown) {
            return (
                <AppContentContainer key="shutdown" initial="hidden">
                    <Suspense fallback={<div />}>
                        <ShuttingDownScreen />
                    </Suspense>
                </AppContentContainer>
            );
        }
        return (
            <AppContentContainer key="splashscreen" initial="visible">
                <Splashscreen />
            </AppContentContainer>
        );
    }, [showSplashscreen, isShuttingDown]);

    return <AnimatePresence mode="wait">{currentSection}</AnimatePresence>;
}

export default function App() {
    const isShuttingDown = useUIStore((s) => s.isShuttingDown);
    const showSplashscreen = useUIStore((s) => s.showSplashscreen);
    const showTapplet = useUIStore((s) => s.showTapplet);
    const isWindowHidden = useWindowVisibility();

    const { t } = useTranslation('common');

    // Feature 18: Move WebGL check out of render body into useEffect to eliminate render-phase side effects
    useEffect(() => {
        if (!window.WebGL2RenderingContext && !window.WebGLRenderingContext) {
            console.error(`WebGL not supported by the browser - userAgent: ${navigator.userAgent}`);
            setIsWebglNotSupported(true);
            setError(t('webgl-not-supported'));
        }
    }, [t]);

    // Feature 19: Pause Tower Three.js render loop when hidden, shutting down, or displaying tapplet
    const hideCanvas = showSplashscreen || isShuttingDown || showTapplet || isWindowHidden;
    useTowerCanvasPause(hideCanvas);

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <GlobalReset />
                <GlobalStyle $hideCanvas={hideCanvas} />
                <LazyMotion features={domMax} strict>
                    <FloatingElements />
                    <CurrentAppSection showSplashscreen={showSplashscreen} isShuttingDown={isShuttingDown} />
                </LazyMotion>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
