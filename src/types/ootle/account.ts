import { VaultData } from '@tari-project/tarijs';

export interface OotleAccount {
    account_id: number;
    address: string;
    public_key: string;
    resources: VaultData[];
    account_name: string;
}
