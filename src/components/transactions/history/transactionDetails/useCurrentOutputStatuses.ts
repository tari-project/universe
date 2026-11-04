import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { BACKEND_STATE_UPDATE, type BackendStateUpdateEvent } from '@app/types/backend-state.ts';
import { type FixedHash, type OutputStatus, type TransactionOutput } from '@app/types/app-status.ts';

const REFRESH_INTERVAL_MS = 5000;
const STATUS_EVENTS = new Set([
    'WalletBalanceUpdate',
    'WalletTransactionsFound',
    'WalletTransactionUpdated',
    'WalletTransactionsCleared',
]);

export function useCurrentOutputStatuses(outputs: TransactionOutput[]): (OutputStatus | null)[] {
    const key = JSON.stringify(outputs.map((output) => output.hash));
    const [snapshot, setSnapshot] = useState<{ key: string; statuses: (OutputStatus | null)[] } | null>(null);

    useEffect(() => {
        const hashes = JSON.parse(key) as FixedHash[];
        if (hashes.length === 0) return;
        let active = true;
        let latestRequest = 0;
        let unlisten: (() => void) | undefined;

        const refresh = async () => {
            const request = ++latestRequest;
            try {
                const statuses = await invoke<(OutputStatus | null)[]>('get_wallet_output_statuses', { hashes });
                if (active && request === latestRequest) {
                    setSnapshot({ key, statuses: hashes.map((_, index) => statuses[index] ?? null) });
                }
            } catch {
                if (active && request === latestRequest) {
                    setSnapshot({ key, statuses: hashes.map(() => null) });
                }
            }
        };

        void refresh();
        void listen<BackendStateUpdateEvent>(BACKEND_STATE_UPDATE, ({ payload }) => {
            if (STATUS_EVENTS.has(payload.event_type)) void refresh();
        }).then(
            (stop) => {
                if (active) unlisten = stop;
                else stop();
            },
            () => undefined
        );
        const interval = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
        return () => {
            active = false;
            window.clearInterval(interval);
            unlisten?.();
        };
    }, [key]);

    return snapshot?.key === key ? snapshot.statuses : outputs.map(() => null);
}
