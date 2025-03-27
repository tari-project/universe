import './i18initializer';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import AppWrapper from './App/AppWrapper.tsx';
import { I18nextProvider } from 'react-i18next';

document.addEventListener('DOMContentLoaded', () => {
    if (!window.WebGL2RenderingContext && !window.WebGLRenderingContext) {
        console.error('WebGL not supported!');
    }
});

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <StrictMode>
        <Suspense fallback={<div />}>
            <AppWrapper />
        </Suspense>
    </StrictMode>
);
