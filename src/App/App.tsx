import { lazy, Suspense } from 'react';
import { LazyMotion, domMax, AnimatePresence } from 'motion/react';
import { QueryClientProvider } from '@tanstack/react-query';

import { useShuttingDown } from '../hooks/app/useShuttingDown.ts';

import { GlobalReset, GlobalStyle } from '../theme/GlobalStyle.ts';
import ThemeProvider from '../theme/ThemeProvider.tsx';

import { AppContentContainer } from './App.styles.ts';
import { useUIStore } from '../store/useUIStore.ts';
import { TOWER_CANVAS_ID } from '../store/types/ui.ts';
import { queryClient } from './queryClient.ts';

import Splashscreen from '../containers/phase/Splashscreen/Splashscreen.tsx';

const ShuttingDownScreen = lazy(() => import('../containers/phase/ShuttingDownScreen/ShuttingDownScreen.tsx'));
const FloatingElements = lazy(() => import('../containers/floating/FloatingElements.tsx'));
const MainView = lazy(() => import('../containers/main/MainView.tsx'));

export default function App() {
    const showSplashscreen = useUIStore((s) => s.showSplashscreen);
    const isShuttingDown = useShuttingDown();

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <GlobalReset />
                <GlobalStyle $hideCanvas={showSplashscreen || isShuttingDown} />
                <LazyMotion features={domMax} strict>
                    <FloatingElements />
                    <AnimatePresence mode="wait">
                        {!isShuttingDown && !showSplashscreen && (
                            <AppContentContainer key="main" initial="hidden">
                                <Suspense fallback={<div />}>
                                    <MainView />
                                </Suspense>
                            </AppContentContainer>
                        )}
                        {isShuttingDown && (
                            <AppContentContainer key="shutdown" initial="hidden">
                                <Suspense fallback={<div />}>
                                    <ShuttingDownScreen />
                                </Suspense>
                            </AppContentContainer>
                        )}
                        {showSplashscreen && (
                            <AppContentContainer key="splashscreen" initial="visible">
                                <Splashscreen />
                            </AppContentContainer>
                        )}
                    </AnimatePresence>
                    <canvas id={TOWER_CANVAS_ID} />
                </LazyMotion>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
