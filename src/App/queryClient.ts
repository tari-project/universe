import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: { refetchOnWindowFocus: true, staleTime: 1000 * 60 * 60 * 24 },
    },
});
