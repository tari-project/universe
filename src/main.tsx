import './i18initializer';
import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
const AppWrapper = lazy(() => import('./App/AppWrapper.tsx'));

const rootEl = document.getElementById('root');
const options = {
    onUncaughtError: (error, errorInfo) => {
        console.error('Uncaught error: ', error, errorInfo);
    },
    onCaughtError: (error, errorInfo) => {
        console.error('Caught error: ', error, errorInfo);
    },
};

if (rootEl) {
    const root = createRoot(rootEl, options);
    root.render(
        <StrictMode>
            <Suspense fallback={<div />}>
                <AppWrapper />
            </Suspense>
        </StrictMode>
    );
}
