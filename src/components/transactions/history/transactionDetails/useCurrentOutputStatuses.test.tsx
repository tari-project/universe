import { act, renderHook, waitFor } from '@testing-library/react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OutputStatus, type TransactionOutput } from '@app/types/app-status.ts';
import { useCurrentOutputStatuses } from './useCurrentOutputStatuses.ts';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/event', () => ({ listen: vi.fn() }));

const output = (byte: number) => ({ hash: Array(32).fill(byte) }) as TransactionOutput;
const outputs = [output(1)];

describe('current transaction output statuses', () => {
    let onEvent: ((event: { payload: { event_type: string } }) => void) | undefined;

    beforeEach(() => {
        vi.clearAllMocks();
        onEvent = undefined;
        vi.mocked(listen).mockImplementation(async (_event, callback) => {
            onEvent = callback as typeof onEvent;
            return () => undefined;
        });
    });

    it('reads the active output row and refreshes after wallet updates', async () => {
        vi.mocked(invoke)
            .mockResolvedValueOnce([OutputStatus.Unspent] as never)
            .mockResolvedValueOnce([OutputStatus.Locked] as never);
        const { result } = renderHook(() => useCurrentOutputStatuses(outputs));
        expect(result.current).toEqual([null]);
        await waitFor(() => expect(result.current).toEqual([OutputStatus.Unspent]));
        act(() => onEvent?.({ payload: { event_type: 'WalletBalanceUpdate' } }));
        await waitFor(() => expect(result.current).toEqual([OutputStatus.Locked]));
        expect(invoke).toHaveBeenCalledWith('get_wallet_output_statuses', { hashes: [outputs[0].hash] });
    });

    it('does not show a stored status when the current row is missing or unreadable', async () => {
        vi.mocked(invoke)
            .mockResolvedValueOnce([null] as never)
            .mockRejectedValueOnce(new Error('wallet closed'));
        const { result } = renderHook(() => useCurrentOutputStatuses(outputs));
        await waitFor(() => expect(invoke).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(onEvent).toBeDefined());
        act(() => onEvent?.({ payload: { event_type: 'WalletTransactionsFound' } }));
        await waitFor(() => expect(invoke).toHaveBeenCalledTimes(2));
        expect(result.current).toEqual([null]);
    });

    it('ignores a slower response from an earlier refresh', async () => {
        let finishOld: ((statuses: OutputStatus[]) => void) | undefined;
        vi.mocked(invoke)
            .mockImplementationOnce(
                () =>
                    new Promise<void>((resolve) => {
                        finishOld = (statuses) => resolve(statuses as never);
                    })
            )
            .mockResolvedValueOnce([OutputStatus.Spent] as never);
        const { result } = renderHook(() => useCurrentOutputStatuses(outputs));
        await waitFor(() => expect(onEvent).toBeDefined());
        act(() => onEvent?.({ payload: { event_type: 'WalletTransactionUpdated' } }));
        await waitFor(() => expect(result.current).toEqual([OutputStatus.Spent]));
        await act(async () => finishOld?.([OutputStatus.Unspent]));
        expect(result.current).toEqual([OutputStatus.Spent]);
    });

    it('removes a previously known status when a fresh read fails', async () => {
        vi.mocked(invoke)
            .mockResolvedValueOnce([OutputStatus.Unspent] as never)
            .mockRejectedValueOnce(new Error('wallet closed'));
        const { result } = renderHook(() => useCurrentOutputStatuses(outputs));
        await waitFor(() => expect(result.current).toEqual([OutputStatus.Unspent]));
        act(() => onEvent?.({ payload: { event_type: 'WalletTransactionsCleared' } }));
        await waitFor(() => expect(result.current).toEqual([null]));
    });

    it('never shows the previous transaction status after the selected hashes change', async () => {
        vi.mocked(invoke)
            .mockResolvedValueOnce([OutputStatus.Unspent] as never)
            .mockResolvedValueOnce([OutputStatus.Spent] as never);
        const { result, rerender } = renderHook(({ selected }) => useCurrentOutputStatuses(selected), {
            initialProps: { selected: outputs },
        });
        await waitFor(() => expect(result.current).toEqual([OutputStatus.Unspent]));
        rerender({ selected: [output(2)] });
        expect(result.current).toEqual([null]);
        await waitFor(() => expect(result.current).toEqual([OutputStatus.Spent]));
    });
});
