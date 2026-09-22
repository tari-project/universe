import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

import { FindWalletsResult, WalletRecoveryErrorMessage } from '@app/types/wallet-recovery.ts';

const LOCKOUT_SECONDS_PATTERN = /remaining seconds:\s*(\d+)/i;

/**
 * Matches a backend error to a translation key so the raw `anyhow` chain, which can name keyring
 * entries and quote platform text, is never rendered. A cancelled PIN prompt is the user's own
 * choice and maps to nothing at all.
 */
export function toWalletRecoveryError(e: unknown): WalletRecoveryErrorMessage | null {
    const message = String(e);
    const lowered = message.toLowerCase();

    if (lowered.includes('cancel')) {
        return null;
    }

    if (lowered.includes('locked out') || lowered.includes('is locked')) {
        const seconds = Number(LOCKOUT_SECONDS_PATTERN.exec(message)?.[1]);
        return Number.isFinite(seconds) && seconds > 0
            ? { key: 'find-my-wallets-error-pin-locked-seconds', seconds }
            : { key: 'find-my-wallets-error-pin-locked' };
    }

    if (lowered.includes('keyring') || lowered.includes('keychain') || lowered.includes('credential')) {
        return { key: 'find-my-wallets-error-keyring' };
    }

    return { key: 'find-my-wallets-error-generic' };
}

/**
 * Both commands can prompt for a PIN in the backend, so nothing here runs on mount or polls: the
 * search happens when the user asks for it.
 */
export function useFindMyWallets() {
    const [result, setResult] = useState<FindWalletsResult | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [relinkingId, setRelinkingId] = useState<string | null>(null);
    const [error, setError] = useState<WalletRecoveryErrorMessage | null>(null);

    const search = useCallback(async () => {
        setIsSearching(true);
        setError(null);
        try {
            setResult(await invoke<FindWalletsResult>('find_my_wallets'));
        } catch (e) {
            console.error('Failed to search for wallets:', e);
            setError(toWalletRecoveryError(e));
        } finally {
            setIsSearching(false);
        }
    }, []);

    const relink = useCallback(async (walletId: string) => {
        setRelinkingId(walletId);
        setError(null);
        try {
            const addressPrefix = await invoke<string>('relink_wallet', { walletId });
            // Searching again would raise a second PIN prompt with no dialog behind it, so the list
            // is patched from what a successful re-link means: this wallet is now the only active one.
            setResult((current) =>
                current?.kind === 'found'
                    ? {
                          ...current,
                          wallets: current.wallets.map((wallet) =>
                              wallet.wallet_id === walletId
                                  ? {
                                        ...wallet,
                                        is_active: true,
                                        is_linked: true,
                                        address_prefix: addressPrefix || wallet.address_prefix,
                                    }
                                  : { ...wallet, is_active: false }
                          ),
                      }
                    : current
            );
            return addressPrefix;
        } catch (e) {
            console.error('Failed to re-link wallet:', e);
            setError(toWalletRecoveryError(e));
            return null;
        } finally {
            setRelinkingId(null);
        }
    }, []);

    return { result, isSearching, relinkingId, error, search, relink };
}
