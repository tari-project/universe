import './i18initializer';
import i18n from 'i18next';
import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { setError } from './store/actions/appStateStoreActions.ts';
import { setIsWebglNotSupported } from './store/actions/uiStoreActions.ts';

const AppWrapper = lazy(() => import('./App/AppWrapper.tsx'));

const rootEl = document.getElementById('root');

if (!window.WebGL2RenderingContext && !window.WebGLRenderingContext) {
    console.error(`WebGL not supported by the browser - userAgent: ${navigator.userAgent}`);
    setIsWebglNotSupported(true);
    setError(i18n.t('common:webgl-not-supported'));
}

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
