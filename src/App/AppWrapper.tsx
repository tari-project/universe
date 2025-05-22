import App from './App.tsx';
import AppEffects from './AppEffects.tsx';

export default function AppWrapper() {
    return (
        <>
            <AppEffects />
            <App />
        </>
    );
}
