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
    const initialFetched = useRef(false);
    const pollingEnabled = useAirdropStore((s) => s.features?.includes(FEATURE_FLAGS.FF_POLLING));
    const airdropTimeoutRef = useRef<NodeJS.Timeout>(undefined);
    const featureFlagTimeoutRef = useRef<NodeJS.Timeout>(undefined);

    const fetchAirdropDataDebounced = useCallback(() => {
        if (airdropTimeoutRef.current) {
            clearTimeout(airdropTimeoutRef.current);
        }
        airdropTimeoutRef.current = setTimeout(async () => {
            airdropTimeoutRef.current = undefined;
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
            featureFlagTimeoutRef.current = undefined;
            await fetchFeatureFlags();
        }, 1000 * 60); // Once every minute
    }, [fetchFeatureFlags]);

    useEffect(() => {
        fetchFeatureFlagDebounced();
        const interval = setInterval(fetchFeatureFlagDebounced, 1000 * 60); // Once every minute
        return () => {
            clearInterval(interval);
            if (featureFlagTimeoutRef.current) {
                clearTimeout(featureFlagTimeoutRef.current);
                featureFlagTimeoutRef.current = undefined;
            }
        };
    }, [fetchFeatureFlagDebounced]);

    useEffect(() => {
        let cancelled = false;
        const unlistenFns: UnlistenFn[] = [];
        let interval: NodeJS.Timeout | undefined;

        const registerListener = (handler: () => void) => {
            listen('tauri://focus', () => {
                if (!cancelled) {
                    handler();
                }
            }).then((unlisten) => {
                if (cancelled) {
                    unlisten();
                } else {
                    unlistenFns.push(unlisten);
                }
            });
        };

        // Re-fetch flags on focus
        registerListener(fetchFeatureFlags);

        if (pollingEnabled) {
            // Re-fetch data on focus
            registerListener(fetchAirdropDataDebounced);

            // Start polling
            interval = setInterval(() => {
                fetchAirdropDataDebounced();
            }, 1000 * 60); // Once every minute
        }
        return () => {
            cancelled = true;
            if (interval) {
                clearInterval(interval);
            }
            if (airdropTimeoutRef.current) {
                clearTimeout(airdropTimeoutRef.current);
                airdropTimeoutRef.current = undefined;
            }
            for (const unlisten of unlistenFns) {
                unlisten();
            }
        };
    }, [fetchAirdropDataDebounced, fetchFeatureFlags, pollingEnabled]);

    useEffect(() => {
        if (initialFetched.current) return;

        fetchFeatureFlags().then(() => {
            initialFetched.current = true;
        });
    }, [fetchFeatureFlags]);
};
