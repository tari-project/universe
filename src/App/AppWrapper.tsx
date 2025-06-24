import { lazy, Suspense } from 'react';
import AppEffects from './AppEffects.tsx';
const App = lazy(() => import('./App.tsx'));

export default function AppWrapper() {
    return (
        <>
            <AppEffects />
            <Suspense fallback={<div />}>
                <App />
            </Suspense>
        </>
    );
}
