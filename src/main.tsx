import './i18initializer';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppWrapper from './App/AppWrapper.tsx';

const root = createRoot(document.getElementById('root') as HTMLElement);

root.render(
    <StrictMode>
        <AppWrapper />
    </StrictMode>
);
