import { lazy, Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LazyMotion, domMax, AnimatePresence } from 'motion/react';
import { QueryClientProvider } from '@tanstack/react-query';

import { setError, setIsWebglNotSupported } from '../store/actions';
import { GlobalStyle } from '../theme/GlobalStyle.ts';
import ThemeProvider from '../theme/ThemeProvider.tsx';

import { AppContentContainer } from './App.styles.ts';
import { useUIStore } from '@app/store/useUIStore.ts';
import { queryClient } from './queryClient.ts';

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

    const { t } = useTranslation('common');

    if (!window.WebGL2RenderingContext && !window.WebGLRenderingContext) {
        console.error(`WebGL not supported by the browser - userAgent: ${navigator.userAgent}`);
        setIsWebglNotSupported(true);
        setError(t('webgl-not-supported'));
    }
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <>
                    <GlobalStyle $hideCanvas={showSplashscreen || isShuttingDown} />
                    <LazyMotion features={domMax} strict>
                        <FloatingElements />
                        <CurrentAppSection showSplashscreen={showSplashscreen} isShuttingDown={isShuttingDown} />
                    </LazyMotion>
                </>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
