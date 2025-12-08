import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAirdropStore } from '@app/store';
import { openTrancheModal } from '@app/store/actions/airdropStoreActions';
import { handleTrancheRefresh } from '@app/hooks/airdrop/stateHelpers/useAirdropTokensRefresh';
import { KEY_TRANCHE_STATUS } from './useTrancheStatus';
import { addToast } from '@app/components/ToastStack/useToastStore';

interface TrancheAutoRefreshOptions {
    enabled?: boolean;
    notifyOnNewTranches?: boolean;
    onRefreshSuccess?: () => void;
    onRefreshError?: (error: Error) => void;
}

export function useTrancheAutoRefresh({
    enabled = true,
    notifyOnNewTranches = true,
    onRefreshSuccess,
    onRefreshError,
}: TrancheAutoRefreshOptions = {}) {
    const { t } = useTranslation('airdrop', { useSuspense: false });
    const queryClient = useQueryClient();
    const lastAvailableCountRef = useRef<number>(0);
    const trancheStatus = useAirdropStore((state) => state.trancheStatus);
    const userDetails = useAirdropStore((state) => state.userDetails);
    const isLoggedIn = !!userDetails?.user?.id;
    const refreshDisabled = !enabled || !isLoggedIn;

    const refreshTranches = useCallback(async () => {
        try {
            const success = await handleTrancheRefresh();

            if (success) {
                // Invalidate React Query cache to trigger re-fetch
                await queryClient.invalidateQueries({ queryKey: [KEY_TRANCHE_STATUS] });
                onRefreshSuccess?.();
                return true;
            } else {
                console.error('Failed to refresh tranche status');
            }
        } catch (error) {
            const errorObj = error instanceof Error ? error : new Error('Unknown error in TrancheAutoRefresh');
            onRefreshError?.(errorObj);
            console.error('Tranche auto-refresh failed:', errorObj);
            return false;
        }
    }, [queryClient, onRefreshSuccess, onRefreshError]);

    useEffect(() => {
        if (!trancheStatus || !notifyOnNewTranches) return;
        const currentAvailableCount = trancheStatus.availableCount;
        // If we have more available tranches than before, notify the user and auto-open modal
        if (lastAvailableCountRef.current > 0 && currentAvailableCount > lastAvailableCountRef.current) {
            const newTrancheCount = currentAvailableCount - lastAvailableCountRef.current;
            const plural = newTrancheCount === 1 ? 'tranche is' : 'tranches are';
            addToast({
                type: 'info',
                title: t('tranche.notifications.new-tranche-available'),
                text: t('tranche.notifications.new-tranches-available', { count: newTrancheCount, plural }),
                timeout: 8000,
            });
            // Auto-open modal when new tranches become available
            openTrancheModal();
        }

        // If this is the initial load and we have available tranches, auto-open modal
        if (lastAvailableCountRef.current === 0 && currentAvailableCount > 0) {
            openTrancheModal();
        }
        lastAvailableCountRef.current = currentAvailableCount;
    }, [notifyOnNewTranches, trancheStatus, t]);

    // Refresh on app focus
    useEffect(() => {
        if (refreshDisabled) return;

        const handleFocus = () => refreshTranches();
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                void handleFocus();
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [refreshDisabled, refreshTranches]);

    return { refreshTranches };
}
