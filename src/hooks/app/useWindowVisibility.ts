import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

/**
 * Tracks application window visibility using the browser Visibility API and Tauri v2 window events.
 */
export function useWindowVisibility(): boolean {
    const [isHidden, setIsHidden] = useState<boolean>(() =>
        typeof document !== 'undefined' ? document.hidden : false
    );

    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsHidden(document.hidden);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        let cancelled = false;
        const unlistenFocus: { current?: () => void } = {};
        try {
            const appWin = getCurrentWindow();
            if (appWin?.isMinimized) {
                appWin
                    .isMinimized()
                    .then((minimized) => {
                        if (!cancelled && minimized) setIsHidden(true);
                    })
                    .catch(() => {
                        // Ignore in non-Tauri or unsupported environments
                    });
            }
            if (appWin?.onFocusChanged) {
                appWin
                    .onFocusChanged(({ payload: focused }) => {
                        if (cancelled) return;
                        if (!focused && document.hidden) {
                            setIsHidden(true);
                        } else if (focused) {
                            setIsHidden(false);
                        }
                    })
                    .then((fn) => {
                        if (cancelled) {
                            fn();
                        } else {
                            unlistenFocus.current = fn;
                        }
                    })
                    .catch(() => {
                        // Ignore in non-Tauri or unsupported environments
                    });
            }
        } catch {
            // Fallback for non-Tauri environments (vitest, web)
        }

        return () => {
            cancelled = true;
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            unlistenFocus.current?.();
        };
    }, []);

    return isHidden;
}
