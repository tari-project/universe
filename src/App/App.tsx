import { LazyMotion, domMax, MotionConfig } from 'framer-motion';

import { useAppStateStore } from '@app/store/appStateStore';
import { useShuttingDown } from '@app/hooks';
import ShuttingDownScreen from '../containers/phase/ShuttingDownScreen/ShuttingDownScreen.tsx';
import FloatingElements from '../containers/floating/FloatingElements.tsx';
import MainView from '../containers/main/MainView.tsx';
import Setup from '../containers/phase/Setup/Setup';

import { GlobalReset, GlobalStyle } from '../theme/GlobalStyle.ts';
import ThemeProvider from '../theme/ThemeProvider.tsx';

import AppContent from './AppContent';

export default function App() {
    const isShuttingDown = useShuttingDown();
    const isSettingUp = useAppStateStore((s) => s.isSettingUp);
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
                        {isSettingUp ? <Setup /> : null}
                        {isShuttingDown || isSettingUp ? null : <MainView />}
                        {isShuttingDown ? <ShuttingDownScreen /> : null}
                    </AppContent>
                </MotionConfig>
            </LazyMotion>
        </ThemeProvider>
    );
}
