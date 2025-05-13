import App from './App.tsx';
import AppEffects from './AppEffects.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function AppWrapper() {
    return (
        <>
            <AppEffects />
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </>
    );
}
