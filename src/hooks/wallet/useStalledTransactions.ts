import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { StalledTransaction } from '@app/types/app-status.ts';

// A send becomes stalled without its history entry changing, so also look again now and then.
const REFRESH_MS = 60_000;

/** The sends and burns the network keeps refusing. Fetched once per list, again whenever
 * `refreshKey` changes (keep it to something that changes rarely), and every minute while
 * `enabled`. */
export function useStalledTransactions(refreshKey: unknown, enabled = true): StalledTransaction[] {
    const [stalled, setStalled] = useState<StalledTransaction[]>([]);

    useEffect(() => {
        if (!enabled) return;
        let ignore = false;
        const load = () =>
            invoke('get_stalled_transactions')
                .then((list) => {
                    if (!ignore) setStalled(list);
                })
                .catch((e) => console.warn('Could not load stalled transactions:', e));
        void load();
        const timer = setInterval(load, REFRESH_MS);
        return () => {
            ignore = true;
            clearInterval(timer);
        };
    }, [refreshKey, enabled]);

    return stalled;
}
