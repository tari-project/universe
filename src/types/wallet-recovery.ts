/**
 * Payloads of the "find my wallets" recovery commands, mirroring `src-tauri/src/wallet_recovery.rs`.
 * Nothing that could identify or reconstruct a wallet beyond an 8-character address prefix crosses
 * this boundary: no seed, no blob, no view key.
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

/**
 * A translation key and its interpolation values. Backend errors are `anyhow` chains that can carry
 * keyring entry names and platform text, so only this reaches the screen.
 */
export interface WalletRecoveryErrorMessage {
    key: string;
    seconds?: number;
}
