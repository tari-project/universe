import { useEffect } from 'react';

export const useDisableRefresh = () => {
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            return;
        }
        const keydownListener = function (event: KeyboardEvent) {
            // Prevent F5 or Ctrl+R (Windows/Linux) and Command+R (Mac) from refreshing the page
            if (event.key === 'F5' || (event.ctrlKey && event.key === 'r') || (event.metaKey && event.key === 'r')) {
                event.preventDefault();
            }
        };

        const contextmenuListener = function (event: MouseEvent) {
            event.preventDefault();
        };

        document.addEventListener('keydown', keydownListener);
        document.addEventListener('contextmenu', contextmenuListener);

        return () => {
            document.removeEventListener('keydown', keydownListener);
            document.removeEventListener('contextmenu', contextmenuListener);
        };
    }, []);
};
