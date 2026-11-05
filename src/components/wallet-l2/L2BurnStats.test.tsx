import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@app/test/test-utils';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { Network } from '@app/utils/network.ts';
import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';
import { L2BurnStats } from './L2BurnStats';

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));
vi.mock('@app/hooks/airdrop/utils/useHandleRequest.ts', () => ({ handleAirdropRequest: vi.fn() }));

const stats = { network: 'mainnet', totalMicroMinotari: '5000000000123456', burnCount: 125000, uniqueBurners: 42000 };

describe('L2BurnStats', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.mocked(handleAirdropRequest).mockReset();
        useMiningStore.setState({ network: Network.MainNet });
    });
    afterEach(() => vi.useRealTimers());

    const flush = () => act(() => vi.advanceTimersByTimeAsync(0));

    it('shows whole XTM burned, burns and unique burners for the current network', async () => {
        vi.mocked(handleAirdropRequest).mockResolvedValue(stats);
        render(<L2BurnStats />);
        await flush();

        expect(handleAirdropRequest).toHaveBeenCalledWith(
            expect.objectContaining({ path: '/miner/burns/stats?network=mainnet', publicRequest: true })
        );
        expect(screen.getByTestId('l2-burn-value')).toHaveTextContent('5,000,000,000');
        expect(screen.getByRole('heading')).toHaveTextContent('l2.burn-stats.total');
    });

    it('rotates through XTM burned, burns and unique burners every five seconds, then wraps', async () => {
        vi.mocked(handleAirdropRequest).mockResolvedValue(stats);
        render(<L2BurnStats />);
        await flush();

        await act(() => vi.advanceTimersByTimeAsync(5000));
        expect(screen.getByTestId('l2-burn-value')).toHaveTextContent('125,000');
        expect(screen.getByRole('heading')).toHaveTextContent('l2.burn-stats.burns');
        await act(() => vi.advanceTimersByTimeAsync(5000));
        expect(screen.getByTestId('l2-burn-value')).toHaveTextContent('42,000');
        await act(() => vi.advanceTimersByTimeAsync(5000));
        expect(screen.getByTestId('l2-burn-value')).toHaveTextContent('5,000,000,000');
    });

    it('jumps to a stat from its dot and restarts the wait', async () => {
        vi.mocked(handleAirdropRequest).mockResolvedValue(stats);
        render(<L2BurnStats />);
        await flush();

        await act(() => vi.advanceTimersByTimeAsync(4000));
        act(() => screen.getByRole('button', { name: 'l2.burn-stats.people' }).click());
        expect(screen.getByTestId('l2-burn-value')).toHaveTextContent('42,000');
        await act(() => vi.advanceTimersByTimeAsync(4000));
        expect(screen.getByTestId('l2-burn-value')).toHaveTextContent('42,000');
    });

    it('refreshes every minute', async () => {
        vi.mocked(handleAirdropRequest).mockResolvedValue(stats);
        render(<L2BurnStats />);
        await flush();

        vi.mocked(handleAirdropRequest).mockResolvedValue({ ...stats, totalMicroMinotari: '6000000000000000' });
        await act(() => vi.advanceTimersByTimeAsync(60_000));
        act(() => screen.getByRole('button', { name: 'l2.burn-stats.total' }).click());
        expect(screen.getByTestId('l2-burn-value')).toHaveTextContent('6,000,000,000');
    });

    it.each([
        ['a failed request', () => vi.mocked(handleAirdropRequest).mockRejectedValue(new Error('down'))],
        ['another network', () => vi.mocked(handleAirdropRequest).mockResolvedValue({ ...stats, network: 'nextnet' })],
        [
            'a malformed total',
            () => vi.mocked(handleAirdropRequest).mockResolvedValue({ ...stats, totalMicroMinotari: '-1' }),
        ],
        ['no response', () => vi.mocked(handleAirdropRequest).mockResolvedValue(undefined)],
    ])('renders nothing for %s', async (_, arrange) => {
        arrange();
        render(<L2BurnStats />);
        await flush();

        expect(screen.queryByTestId('l2-burn-stats')).not.toBeInTheDocument();
    });
});
