import { useAirdropStore } from '@app/store';
import {
    fetchAllUserData,
    fetchCommunityMessages,
    fetchLatestXSpaceEvent,
    fetchOrphanChainUiFeatureFlag,
    fetchPollingFeatureFlag,
    fetchWarmupFeatureFlag,
    fetchUiSendRecvFeatureFlag,
} from '@app/store/actions/airdropStoreActions';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useCallback, useEffect, useRef } from 'react';

const DEBOUNCE_DELAY = 1000; // 1 second delay

export const useAirdropPolling = () => {
    const pollingEnabled = useAirdropStore((s) => s.pollingEnabled);
    const airdropTimeoutRef = useRef<NodeJS.Timeout>();
    const featureFlagTimeoutRef = useRef<NodeJS.Timeout>();

    const fetchAirdropDataDebounced = useCallback(() => {
        if (airdropTimeoutRef.current) {
            clearTimeout(airdropTimeoutRef.current);
        }
        airdropTimeoutRef.current = setTimeout(async () => {
            await fetchCommunityMessages();
            await fetchAllUserData();
            await fetchLatestXSpaceEvent();
        }, DEBOUNCE_DELAY);
    }, []);

    const fetchFeatureFlags = useCallback(() => {
        fetchOrphanChainUiFeatureFlag();
        fetchPollingFeatureFlag();
        fetchUiSendRecvFeatureFlag();
        fetchWarmupFeatureFlag();
    }, []);

    const fetchFeatureFlagDebounced = useCallback(() => {
        if (featureFlagTimeoutRef.current) {
            return;
        }
        featureFlagTimeoutRef.current = setTimeout(async () => {
            fetchFeatureFlags();
            if (featureFlagTimeoutRef.current) {
                clearTimeout(featureFlagTimeoutRef.current);
            }
        }, 1000 * 60); // Once every minute
    }, [fetchFeatureFlags]);

    useEffect(() => {
        fetchFeatureFlagDebounced();
        const interval = setInterval(fetchFeatureFlagDebounced, 1000 * 60); // Once every minute
        return () => clearInterval(interval);
    }, [fetchFeatureFlagDebounced]);

    useEffect(() => {
        const unlistenPromises: Promise<UnlistenFn>[] = [];
        let interval: NodeJS.Timeout;

        // Re-fetch flags on focus
        unlistenPromises.push(listen('tauri://focus', fetchFeatureFlags));

        if (pollingEnabled) {
            // Re-fetch data on focus
            unlistenPromises.push(listen('tauri://focus', fetchAirdropDataDebounced));

            // Start polling
            interval = setInterval(async () => {
                fetchAirdropDataDebounced();
            }, 1000 * 60); // Once every minute
        }
        return () => {
            if (interval) {
                clearInterval(interval);
            }
            if (airdropTimeoutRef.current) {
                clearTimeout(airdropTimeoutRef.current);
            }
            for (const unlisten of unlistenPromises) {
                unlisten.then((unlisten) => unlisten());
            }
        };
    }, [fetchAirdropDataDebounced, fetchFeatureFlags, pollingEnabled]);
};
