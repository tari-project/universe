import './i18initializer';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import AppWrapper from './App/AppWrapper.tsx';

const rootEl = document.getElementById('root');

if (rootEl) {
    const root = createRoot(rootEl, {
        onUncaughtError: (error, errorInfo) => {
            console.error('Uncaught error: ', error, errorInfo);
        },
        onCaughtError: (error, errorInfo) => {
            console.error('Caught error: ', error, errorInfo);
        },
        onRecoverableError: (error, errorInfo) => {
            console.error('RecoverableError error: ', error, errorInfo);
        },
    });
    root.render(
        <StrictMode>
            <Suspense fallback={<div />}>
                <AppWrapper />
            </Suspense>
        </StrictMode>
    );
}
