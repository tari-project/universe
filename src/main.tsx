import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppWrapper from './AppWrapper.tsx';

const root = createRoot(document.getElementById('root') as HTMLElement);

root.render(
    <StrictMode>
        <AppWrapper />
    </StrictMode>
);
