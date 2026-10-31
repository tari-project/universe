import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAirdropStore } from '@app/store';
import { openTrancheModal } from '@app/store/actions/airdropStoreActions';
import { handleTrancheRefresh } from '@app/hooks/airdrop/stateHelpers/useAirdropTokensRefresh';
import { KEY_TRANCHE_STATUS } from './useTrancheStatus';
import { addToast } from '@app/components/ToastStack/useToastStore';

const FOCUS_REFRESH_COOLDOWN_MS = 1000;
let inFlightTrancheRefresh: Promise<boolean> | null = null;
let lastFocusRefreshTimestamp = 0;

export function resetTrancheAutoRefreshStateForTests() {
    inFlightTrancheRefresh = null;
    lastFocusRefreshTimestamp = 0;
}

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
        if (inFlightTrancheRefresh) {
            return inFlightTrancheRefresh;
        }

        const runRefresh = (async () => {
            try {
                const success = await handleTrancheRefresh();

                if (success) {
                    // Invalidate React Query cache to trigger re-fetch
                    await queryClient.invalidateQueries({ queryKey: [KEY_TRANCHE_STATUS] });
                    onRefreshSuccess?.();
                    return true;
                } else {
                    console.error('Failed to refresh tranche status');
                    return false;
                }
            } catch (error) {
                const errorObj = error instanceof Error ? error : new Error('Unknown error in TrancheAutoRefresh');
                onRefreshError?.(errorObj);
                console.error('Tranche auto-refresh failed:', errorObj);
                return false;
            } finally {
                inFlightTrancheRefresh = null;
            }
        })();

        inFlightTrancheRefresh = runRefresh;
        return runRefresh;
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

    // Refresh on app focus, coalescing back-to-back focus and visibilitychange events across mounted hooks
    useEffect(() => {
        if (refreshDisabled) return;

        const triggerFocusRefresh = () => {
            const now = Date.now();
            if (now - lastFocusRefreshTimestamp < FOCUS_REFRESH_COOLDOWN_MS) {
                return;
            }
            lastFocusRefreshTimestamp = now;
            void refreshTranches();
        };

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                triggerFocusRefresh();
            }
        };

        window.addEventListener('focus', triggerFocusRefresh);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', triggerFocusRefresh);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [refreshDisabled, refreshTranches]);

    return { refreshTranches };
}
