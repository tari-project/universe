import { createRoot } from 'react-dom/client';
import App from './App';
import { StrictMode } from 'react';
import './i18initializer';

const root = createRoot(document.getElementById('root') as HTMLElement);

root.render(
    <StrictMode>
        <App />
    </StrictMode>
);
