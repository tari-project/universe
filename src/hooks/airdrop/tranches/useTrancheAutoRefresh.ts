import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAirdropStore } from '@app/store';
import { openTrancheModal } from '@app/store/actions/airdropStoreActions';
import {
    handleTrancheRefresh,
    handleFullAirdropRefresh,
} from '@app/hooks/airdrop/stateHelpers/useAirdropTokensRefresh';
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
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastAvailableCountRef = useRef<number>(0);

    const trancheStatus = useAirdropStore((state) => state.trancheStatus);
    const userDetails = useAirdropStore((state) => state.userDetails);
    const isLoggedIn = !!userDetails?.user?.id;

    // Manual refresh function
    const refreshTranches = useCallback(async () => {
        try {
            const success = await handleTrancheRefresh();

            if (success) {
                // Invalidate React Query cache to trigger re-fetch
                queryClient.invalidateQueries({ queryKey: [KEY_TRANCHE_STATUS] });
                onRefreshSuccess?.();
                return true;
            } else {
                throw new Error('Failed to refresh tranche status');
            }
        } catch (error) {
            const errorObj = error instanceof Error ? error : new Error('Unknown error');
            onRefreshError?.(errorObj);
            console.error('Tranche auto-refresh failed:', errorObj);
            return false;
        }
    }, [queryClient, onRefreshSuccess, onRefreshError]);

    // Full refresh including tokens and tranches
    const refreshAll = useCallback(async () => {
        try {
            const result = await handleFullAirdropRefresh();

            if (result.tranchesRefreshed) {
                queryClient.invalidateQueries({ queryKey: [KEY_TRANCHE_STATUS] });
            }

            onRefreshSuccess?.();
            return result;
        } catch (error) {
            const errorObj = error instanceof Error ? error : new Error('Unknown error');
            onRefreshError?.(errorObj);
            console.error('Full airdrop auto-refresh failed:', errorObj);
            return { tokensRefreshed: false, tranchesRefreshed: false };
        }
    }, [queryClient, onRefreshSuccess, onRefreshError]);

    // Check for new available tranches and notify user
    useEffect(() => {
        if (!trancheStatus || !notifyOnNewTranches) return;

        const currentAvailableCount = trancheStatus.availableCount;

        console.debug('📊 Tranche availability check:');
        console.debug('  - currentAvailableCount:', currentAvailableCount);
        console.debug('  - lastAvailableCountRef.current:', lastAvailableCountRef.current);
        console.debug(
            '  - tranches:',
            trancheStatus.tranches.map((t) => ({
                id: t.id,
                claimed: t.claimed,
                canClaim: t.canClaim,
                validFrom: t.validFrom,
                validTo: t.validTo,
            }))
        );

        // If we have more available tranches than before, notify the user and auto-open modal
        if (lastAvailableCountRef.current > 0 && currentAvailableCount > lastAvailableCountRef.current) {
            const newTrancheCount = currentAvailableCount - lastAvailableCountRef.current;

            console.debug('🎉 New tranches detected!', newTrancheCount);

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
            console.debug('🎉 Initial load with available tranches detected, auto-opening modal');
            openTrancheModal();
        }

        lastAvailableCountRef.current = currentAvailableCount;
    }, [notifyOnNewTranches, trancheStatus, t]);

    // Smart interval logic based on tranche timing
    const getRefreshInterval = useCallback(() => {
        if (!trancheStatus) return 15 * 60 * 1000; // 15 minutes default

        // If we have available tranches, check more frequently
        if (trancheStatus.availableCount > 0) {
            return 30 * 1000; // 30 seconds
        }

        // If next tranche is soon, check more frequently
        if (trancheStatus.nextAvailable) {
            const nextTime = new Date(trancheStatus.nextAvailable).getTime();
            const now = Date.now();
            const timeDiff = nextTime - now;

            if (timeDiff <= 5 * 60 * 1000) {
                // 5 minutes
                return 30 * 1000; // 30 seconds
            } else if (timeDiff <= 60 * 60 * 1000) {
                // 1 hour
                return 2 * 60 * 1000; // 2 minutes
            } else if (timeDiff <= 24 * 60 * 60 * 1000) {
                // 24 hours
                return 5 * 60 * 1000; // 5 minutes
            }
        }

        // Default: check every 15 minutes
        return 15 * 60 * 1000;
    }, [trancheStatus]);

    // Set up automatic refresh interval
    useEffect(() => {
        if (!enabled || !isLoggedIn) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        const setupInterval = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            const interval = getRefreshInterval();

            intervalRef.current = setInterval(() => {
                refreshTranches();
            }, interval);
        };

        // Set up initial interval
        setupInterval();

        // Update interval when tranche status changes
        const timeoutId = setTimeout(setupInterval, 1000 * 10);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            clearTimeout(timeoutId);
        };
    }, [enabled, isLoggedIn, getRefreshInterval, refreshTranches]);

    // Refresh on app focus
    useEffect(() => {
        if (!enabled || !isLoggedIn) return;

        const handleFocus = () => {
            refreshTranches();
        };

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                handleFocus();
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [enabled, isLoggedIn, refreshTranches, trancheStatus]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, []);

    return {
        refreshTranches,
        refreshAll,
        isAutoRefreshEnabled: enabled && isLoggedIn,
        currentInterval: getRefreshInterval(),
    };
}

// Hook for components that need to refresh tranches on specific events
export function useTrancheRefreshOnEvents(events: string[] = ['claim-success', 'claim-error']) {
    const { refreshTranches } = useTrancheAutoRefresh({ enabled: false });

    useEffect(() => {
        const handleEvent = (event: CustomEvent) => {
            console.info(`Tranche refresh triggered by event: ${event.type}`);
            refreshTranches();
        };

        events.forEach((eventName) => {
            window.addEventListener(eventName, handleEvent as EventListener);
        });

        return () => {
            events.forEach((eventName) => {
                window.removeEventListener(eventName, handleEvent as EventListener);
            });
        };
    }, [events, refreshTranches]);

    return { refreshTranches };
}
