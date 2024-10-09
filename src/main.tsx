import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setupLogger } from './utils/shared-logger.ts';
import './i18initializer';
import App from './App';

const root = createRoot(document.getElementById('root') as HTMLElement);
setupLogger();

root.render(
    <StrictMode>
        <App />
    </StrictMode>
);
