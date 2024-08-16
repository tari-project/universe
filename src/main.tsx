import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <Suspense fallback={<div style={{ background: 'red' }} />}>
            <App />
        </Suspense>
    </React.StrictMode>
);
