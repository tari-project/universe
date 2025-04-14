import { useAirdropStore } from '@app/store';
import {
    fetchAllUserData,
    fetchLatestXSpaceEvent,
    fetchPollingFeatureFlag,
} from '@app/store/actions/airdropStoreActions';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useCallback, useEffect, useRef } from 'react';

const DEBOUNCE_DELAY = 1000; // 1 second delay

export const useAirdropPolling = () => {
    const pollingEnabled = useAirdropStore((s) => s.pollingEnabled);
    const timeoutRef = useRef<NodeJS.Timeout>();

    const fetchAirdropDataDebounced = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(async () => {
            await fetchAllUserData();
            await fetchLatestXSpaceEvent();
        }, DEBOUNCE_DELAY);
    }, []);

    useEffect(() => {
        fetchPollingFeatureFlag();
        const interval = setInterval(async () => {
            await fetchPollingFeatureFlag();
        }, 1000 * 60); // Once every minute
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!pollingEnabled) return;
        fetchAirdropDataDebounced();
        const interval = setInterval(async () => {
            fetchAirdropDataDebounced();
        }, 1000 * 60); // Once every minute
        return () => clearInterval(interval);
    }, [fetchAirdropDataDebounced, pollingEnabled]);

    useEffect(() => {
        let listener: Promise<UnlistenFn>;
        if (!pollingEnabled) {
            listener = listen('tauri://focus', fetchPollingFeatureFlag);
        } else {
            listener = listen('tauri://focus', fetchAirdropDataDebounced);
        }
        return () => {
            listener.then((unlisten) => unlisten());
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [fetchAirdropDataDebounced, pollingEnabled]);
};
