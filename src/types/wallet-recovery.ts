/**
 * Payloads of the "find my wallets" recovery commands.
 *
 * Mirrors `src-tauri/src/wallet_recovery.rs`. The backend deliberately sends nothing that could
 * identify or reconstruct a wallet beyond an 8-character address prefix: no seed, no blob, no
 * view key.
 */

export type FoundWalletStatus = 'readable' | 'pin_required' | 'unreadable';

export interface FoundWallet {
    wallet_id: string;
    /** First 8 characters of the wallet's Tari address; only set when `status` is `readable`. */
    address_prefix?: string | null;
    /** The wallet config already lists this id. */
    is_linked: boolean;
    /** This is the wallet the app is using right now. */
    is_active: boolean;
    status: FoundWalletStatus;
}

export type FindWalletsResult = { kind: 'found'; wallets: FoundWallet[] } | { kind: 'unsupported'; platform: string };
