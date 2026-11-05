import { rpc, swarmState } from './swarm';

const ACCOUNT = { Name: 'playwright' };
const XTR = `resource_${'01'.repeat(32)}`;
interface Account {
    address: string;
}
interface Balances {
    balances: { resource_address: string; balance: number | string; confidential_balance: number | string }[];
}

export class Walletd {
    private token?: string;

    constructor(private readonly url = swarmState().walletd) {}

    private async request<T>(method: string, params: unknown): Promise<T> {
        if (!this.token) {
            const { token } = await rpc<{ token: string }>(this.url, 'auth.request', {
                credentials: 'None',
                permissions: ['Admin'],
            });
            if (!token) throw new Error('walletd auth.request returned no bearer token');
            this.token = token;
        }
        return rpc<T>(this.url, method, params, 30_000, this.token);
    }

    account(): Promise<Account> {
        return this.request('accounts.create_or_get', { account: ACCOUNT, is_default: true, key_index: null });
    }

    async balance(): Promise<number> {
        const { balances } = await this.request<Balances>('accounts.get_balances', {
            account: ACCOUNT,
            refresh: true,
        });
        const xtr = balances.find((balance) => balance.resource_address === XTR);
        return xtr ? Number(xtr.balance) + Number(xtr.confidential_balance) : 0;
    }

    async transfer(address: string, amount: number): Promise<void> {
        const request = {
            owner_account: ACCOUNT,
            resource_address: XTR,
            input_selection: 'PreferRevealed',
            fee_params: { input_selection: 'PreferRevealed', pay_fee_with_swap: null },
            transfers: [
                {
                    destination_address: address,
                    blinded_output_amount: amount,
                    revealed_output_amount: 0,
                    pay_to: 'StealthPublicKey',
                    attach_sender_address: true,
                },
            ],
            max_fee: 1,
            dry_run: true,
        };
        // Like the app, settle the dry-run fee before signing the real transfer.
        for (let round = 0; round < 5; round++) {
            const result = await this.request<{ required_fees: number }>('accounts.stealth_transfer', request);
            if (
                !Number.isSafeInteger(result.required_fees) ||
                result.required_fees <= 0 ||
                result.required_fees > 100_000
            )
                throw new Error(`walletd returned invalid claim fee: ${result.required_fees}`);
            if (request.max_fee >= result.required_fees) {
                await this.request('accounts.stealth_transfer', { ...request, dry_run: false });
                return;
            }
            request.max_fee = result.required_fees;
        }
        throw new Error('walletd transfer fee did not settle in 5 dry runs');
    }
}
