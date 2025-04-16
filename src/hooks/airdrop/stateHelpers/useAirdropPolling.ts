import { useAirdropStore } from '@app/store';
import {
    fetchAllUserData,
    fetchCommunityMessages,
    fetchLatestXSpaceEvent,
    fetchOrphanChainUiFeatureFlag,
    fetchPollingFeatureFlag,
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

    const fetchFeatureFlagDebounced = useCallback(() => {
        if (featureFlagTimeoutRef.current) {
            clearTimeout(featureFlagTimeoutRef.current);
        }
        featureFlagTimeoutRef.current = setTimeout(async () => {
            await fetchOrphanChainUiFeatureFlag();
            await fetchPollingFeatureFlag();
        }, 1000 * 60); // Once every minute
    }, []);

    useEffect(() => {
        fetchFeatureFlagDebounced();
        const interval = setInterval(fetchFeatureFlagDebounced, 1000 * 60); // Once every minute
        return () => clearInterval(interval);
    }, [fetchFeatureFlagDebounced]);

    useEffect(() => {
        if (!pollingEnabled) return;
        fetchAirdropDataDebounced();
        const interval = setInterval(async () => {
            fetchAirdropDataDebounced();
        }, 1000 * 60); // Once every minute
        return () => clearInterval(interval);
    }, [fetchAirdropDataDebounced, pollingEnabled]);

    useEffect(() => {
        const unlistenPromises: Promise<UnlistenFn>[] = [];
        unlistenPromises.push(listen('tauri://focus', fetchPollingFeatureFlag));
        if (pollingEnabled) {
            unlistenPromises.push(listen('tauri://focus', fetchAirdropDataDebounced));
        }
        return () => {
            for (const unlisten of unlistenPromises) {
                unlisten.then((unlisten) => unlisten());
            }
            if (airdropTimeoutRef.current) {
                clearTimeout(airdropTimeoutRef.current);
            }
        };
    }, [fetchAirdropDataDebounced, pollingEnabled]);
};
