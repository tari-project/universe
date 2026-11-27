// Through the generated client to fetch: the first wrap-list request must carry no paging
// parameters, which a bridge backend from before paging refuses.
import { afterEach, describe, it, expect, vi } from 'vitest';

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

import { useConfigBEInMemoryStore } from '../useAppConfigStore';
import { fetchBridgeTransactionsHistory } from './bridgeApiActions';

afterEach(() => vi.unstubAllGlobals());

describe('bridge history requests', () => {
    it('sends no limit or offset on the first wrap-list request', async () => {
        const urls: string[] = [];
        vi.stubGlobal(
            'fetch',
            vi.fn(async (url: string) => {
                urls.push(url);
                return new Response(JSON.stringify({ transactions: [], total: 0 }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            })
        );
        useConfigBEInMemoryStore.setState({ bridge_backend_api_url: 'http://bridge' });

        await fetchBridgeTransactionsHistory('me');

        expect(urls).toHaveLength(1);
        expect(urls[0]).toContain('/wrap-token/transactions?walletAddress=me');
        expect(urls[0]).not.toMatch(/[?&](limit|offset)=/);
    });
});
