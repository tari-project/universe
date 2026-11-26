import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@app/test/test-utils';
import { useConfigCoreStore } from '@app/store/stores/config/useConfigCoreStore.ts';
import { L2BurnStats } from './L2BurnStats';

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

const economics = {
    current_epoch: 39026,
    total_claimed: '5000000000123456',
    total_supply: '4999999000123456',
};

const jsonResponse = (body: unknown, ok = true, status = 200) =>
    ({
        ok,
        status,
        json: async () => body,
    }) as Response;

describe('L2BurnStats', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.useFakeTimers();
        fetchSpy = vi.spyOn(globalThis, 'fetch');
        useConfigCoreStore.setState({ ootle_indexer_url: 'https://indexer-a.ootle.tari.com/' });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
        useConfigCoreStore.setState({ ootle_indexer_url: undefined });
    });

    const renderCard = async () => {
        await act(async () => {
            render(<L2BurnStats />);
            await vi.advanceTimersByTimeAsync(0);
        });
    };

    it('fetches total_claimed from the configured Ootle indexer and shows whole XTM burned', async () => {
        fetchSpy.mockResolvedValue(jsonResponse(economics));
        await renderCard();

        expect(fetchSpy).toHaveBeenCalledWith(
            'https://indexer-a.ootle.tari.com/network/economics',
            expect.objectContaining({ signal: expect.any(AbortSignal) })
        );
        expect(screen.getByTestId('l2-burn-value')).toHaveTextContent('5,000,000,000');
        expect(screen.getByRole('heading')).toHaveTextContent('l2.burn-stats.total');
    });

    it('resolves subpath indexer URLs without a trailing slash', async () => {
        useConfigCoreStore.setState({ ootle_indexer_url: 'http://localhost:18300/proxy' });
        fetchSpy.mockResolvedValue(jsonResponse(economics));
        await renderCard();

        expect(fetchSpy).toHaveBeenCalledWith(
            'http://localhost:18300/proxy/network/economics',
            expect.objectContaining({ signal: expect.any(AbortSignal) })
        );
    });

    it('refreshes every minute', async () => {
        fetchSpy.mockResolvedValueOnce(jsonResponse(economics));
        await renderCard();

        fetchSpy.mockResolvedValueOnce(jsonResponse({ ...economics, total_claimed: '6000000000000000' }));
        await act(async () => {
            await vi.advanceTimersByTimeAsync(60_000);
        });
        expect(screen.getByTestId('l2-burn-value')).toHaveTextContent('6,000,000,000');
    });

    it('clears stale stats and re-fetches when the indexer URL changes', async () => {
        fetchSpy.mockResolvedValueOnce(jsonResponse(economics));
        await renderCard();
        expect(screen.getByTestId('l2-burn-value')).toHaveTextContent('5,000,000,000');

        let resolveSecond!: (res: Response) => void;
        fetchSpy.mockImplementationOnce(
            () =>
                new Promise<Response>((resolve) => {
                    resolveSecond = resolve;
                })
        );
        act(() => useConfigCoreStore.setState({ ootle_indexer_url: 'https://esme-indexer-a.ootle.tari.com/' }));
        expect(screen.queryByTestId('l2-burn-stats')).not.toBeInTheDocument();

        await act(async () => {
            resolveSecond(jsonResponse({ ...economics, total_claimed: '3607558990000' }));
            await vi.advanceTimersByTimeAsync(0);
        });
        expect(fetchSpy).toHaveBeenLastCalledWith(
            'https://esme-indexer-a.ootle.tari.com/network/economics',
            expect.objectContaining({ signal: expect.any(AbortSignal) })
        );
        expect(screen.getByTestId('l2-burn-value')).toHaveTextContent('3,607,558');
    });

    it('makes no request and stays hidden when no valid indexer URL is configured', async () => {
        for (const url of [undefined, null, '', 'ftp://indexer.example/', 'not-a-url']) {
            useConfigCoreStore.setState({ ootle_indexer_url: url });
            const { unmount } = render(<L2BurnStats />);
            await act(() => vi.advanceTimersByTimeAsync(0));
            expect(fetchSpy).not.toHaveBeenCalled();
            expect(screen.queryByTestId('l2-burn-stats')).not.toBeInTheDocument();
            unmount();
        }
    });

    it('aborts any in-flight request on unmount', async () => {
        let capturedSignal: AbortSignal | undefined;
        fetchSpy.mockImplementation((_url: unknown, init?: RequestInit) => {
            capturedSignal = init?.signal ?? undefined;
            return new Promise<Response>(() => undefined);
        });

        const { unmount } = render(<L2BurnStats />);
        expect(capturedSignal?.aborted).toBe(false);
        unmount();
        expect(capturedSignal?.aborted).toBe(true);
    });

    it.each([
        ['a failed request', () => fetchSpy.mockRejectedValue(new Error('down'))],
        ['a non-OK response', () => fetchSpy.mockResolvedValue(jsonResponse({}, false, 500))],
        ['a malformed total', () => fetchSpy.mockResolvedValue(jsonResponse({ ...economics, total_claimed: '-1' }))],
        ['an empty response', () => fetchSpy.mockResolvedValue(jsonResponse(undefined))],
        ['a null response', () => fetchSpy.mockResolvedValue(jsonResponse(null))],
    ])('renders nothing for %s', async (_, arrange) => {
        arrange();
        await renderCard();

        expect(screen.queryByTestId('l2-burn-stats')).not.toBeInTheDocument();
    });
});
