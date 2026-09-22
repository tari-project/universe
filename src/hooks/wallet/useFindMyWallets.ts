import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

import { FindWalletsResult } from '@app/types/wallet-recovery.ts';

/**
 * Both commands can prompt for a PIN in the backend, so nothing here runs on mount or polls: the
 * search happens when the user asks for it.
 */
export function useFindMyWallets() {
    const [result, setResult] = useState<FindWalletsResult | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [relinkingId, setRelinkingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const search = useCallback(async () => {
        setIsSearching(true);
        setError(null);
        try {
            setResult(await invoke<FindWalletsResult>('find_my_wallets'));
        } catch (e) {
            console.error('Failed to search for wallets:', e);
            setError(String(e));
        } finally {
            setIsSearching(false);
        }
    }, []);

    const relink = useCallback(
        async (walletId: string) => {
            setRelinkingId(walletId);
            setError(null);
            try {
                const addressPrefix = await invoke<string>('relink_wallet', { walletId });
                // The list's link flags are stale the moment a re-link succeeds.
                await search();
                return addressPrefix;
            } catch (e) {
                console.error('Failed to re-link wallet:', e);
                setError(String(e));
                return null;
            } finally {
                setRelinkingId(null);
            }
        },
        [search]
    );

    return { result, isSearching, relinkingId, error, search, relink };
}
