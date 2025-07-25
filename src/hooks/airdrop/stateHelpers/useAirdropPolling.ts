import { useAirdropStore } from '@app/store';
import {
    fetchAllUserData,
    fetchCommunityMessages,
    fetchFeatures,
    fetchLatestXSpaceEvent,
} from '@app/store/actions/airdropStoreActions';
import { FEATURE_FLAGS } from '@app/store/consts';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { useCallback, useEffect, useRef } from 'react';

const DEBOUNCE_DELAY = 1000; // 1 second delay

export const useAirdropPolling = () => {
    const pollingEnabled = useAirdropStore((s) => s.features?.includes(FEATURE_FLAGS.FF_POLLING));
    const airdropTimeoutRef = useRef<NodeJS.Timeout>(undefined);
    const featureFlagTimeoutRef = useRef<NodeJS.Timeout>(undefined);

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

    const fetchFeatureFlags = useCallback(async () => {
        await fetchFeatures();
    }, []);

    const fetchFeatureFlagDebounced = useCallback(() => {
        if (featureFlagTimeoutRef.current) {
            return;
        }
        featureFlagTimeoutRef.current = setTimeout(async () => {
            await fetchFeatureFlags();
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
