import { useShuttingDown } from '@app/hooks/useShuttingDown';
import { useAppStateStore } from '@app/store/appStateStore';
import { TrayIcon } from '@tauri-apps/api/tray';
import { LazyMotion, domMax, MotionConfig } from 'framer-motion';
import { useCallback, useEffect } from 'react';

import ShuttingDownScreen from '../containers/phase/ShuttingDownScreen/ShuttingDownScreen.tsx';
import FloatingElements from '../containers/floating/FloatingElements.tsx';
import MainView from '../containers/main/MainView.tsx';
import Setup from '../containers/phase/Setup/Setup';

import { GlobalReset, GlobalStyle } from '../theme/GlobalStyle.ts';
import { GlobalFontFace } from '../theme/fonts/GlobalFontFaces.ts';
import ThemeProvider from '../theme/ThemeProvider.tsx';

import AppContent from './AppContent';

export default function App() {
    const isShuttingDown = useShuttingDown();
    const isSettingUp = useAppStateStore((s) => s.isSettingUp);

    const trayStuff = useCallback(async () => {
        const tray = await TrayIcon.getById('universe-systray');

        if (tray) {
            tray.setTitle(null);
            tray.setIcon('icons/icon.png');
        }
    }, []);

    useEffect(() => {
        trayStuff();
    }, []);

    return (
        <ThemeProvider>
            <GlobalReset />
            <GlobalFontFace />
            <GlobalStyle />
            <LazyMotion features={domMax} strict>
                {/*
                 * added to reduce bundle size
                 * see https://www.framer.com/motion/guide-reduce-bundle-size/#synchronous-loading
                 * strict prop for using `m` instead of `motion`- see https://www.framer.com/motion/guide-reduce-bundle-size/#how-to-reduce-the-size-of-the-motion-component
                 */}
                <MotionConfig reducedMotion="user">
                    <FloatingElements />
                    <AppContent>
                        {isSettingUp ? <Setup /> : null}
                        {isShuttingDown || isSettingUp ? null : <MainView />}
                        {isShuttingDown ? <ShuttingDownScreen /> : null}
                    </AppContent>
                </MotionConfig>
            </LazyMotion>
        </ThemeProvider>
    );
}
