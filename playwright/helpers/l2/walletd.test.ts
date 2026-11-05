import { afterEach, expect, it, vi } from 'vitest';
import { Walletd } from './walletd';

afterEach(() => vi.unstubAllGlobals());

it('test_walletd_account_uses_tagged_name_variant', async () => {
    const fetch = vi
        .fn<(url: string, options: RequestInit) => Promise<Response>>()
        .mockImplementation(
            async () => new Response(JSON.stringify({ result: { token: 'fixture-token', address: 'otl_loc_fixture' } }))
        );
    vi.stubGlobal('fetch', fetch);
    await new Walletd('http://127.0.0.1/json_rpc').account();
    expect(JSON.parse(String(fetch.mock.calls[1][1].body)).params.account).toEqual({ Name: 'playwright' });
});

it('test_walletd_balance_uses_tagged_name_and_sums_revealed_confidential', async () => {
    const fetch = vi.fn<(url: string, options: RequestInit) => Promise<Response>>().mockImplementation(
        async () =>
            new Response(
                JSON.stringify({
                    result: {
                        token: 'fixture-token',
                        balances: [
                            {
                                resource_address: `resource_${'01'.repeat(32)}`,
                                balance: 2,
                                confidential_balance: 3,
                            },
                        ],
                    },
                })
            )
    );
    vi.stubGlobal('fetch', fetch);
    expect(await new Walletd('http://127.0.0.1/json_rpc').balance()).toBe(5);
    expect(JSON.parse(String(fetch.mock.calls[1][1].body)).params.account).toEqual({ Name: 'playwright' });
});

it('test_walletd_transfer_uses_tagged_owner_and_exact_micro_amount', async () => {
    const fetch = vi
        .fn<(url: string, options: RequestInit) => Promise<Response>>()
        .mockImplementation(
            async () => new Response(JSON.stringify({ result: { token: 'fixture-token', required_fees: 1 } }))
        );
    vi.stubGlobal('fetch', fetch);
    await new Walletd('http://127.0.0.1/json_rpc').transfer('otl_loc_fixture', 250_000);
    const body = JSON.parse(String(fetch.mock.calls[2][1].body));
    expect(body.params.owner_account).toEqual({ Name: 'playwright' });
    expect(body.params.dry_run).toBe(false);
    expect(body.params.transfers[0].blinded_output_amount).toBe(250_000);
});

it('test_walletd_none_auth_requests_token_and_sends_bearer_header', async () => {
    const fetch = vi
        .fn<(url: string, options: RequestInit) => Promise<Response>>()
        .mockImplementation(async (_url, options) => {
            const body = JSON.parse(String(options.body));
            return new Response(
                JSON.stringify({
                    result:
                        body.method === 'auth.request' ? { token: 'fixture-token' } : { address: 'otl_loc_fixture' },
                })
            );
        });
    vi.stubGlobal('fetch', fetch);
    await new Walletd('http://127.0.0.1/json_rpc').account();
    const first = JSON.parse(String(fetch.mock.calls[0][1].body));
    expect(first).toMatchObject({ method: 'auth.request', params: { credentials: 'None', permissions: ['Admin'] } });
    expect(fetch.mock.calls[1][1].headers).toMatchObject({ Authorization: 'Bearer fixture-token' });
});
