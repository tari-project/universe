import { VaultData } from '@tari-project/tarijs';
export interface OotleAccount {
    account_id: number;
    address: string;
    public_key: string;
    resources: VaultData[];
    account_name: string;
}

// TODO tari.js add to VaultData type field `token_symbol` and `vault_id`
// export interface VaultData {
//     type: string;
//     balance: number;
//     resource_address: string;
//     token_symbol: string;
//     vault_id: string;
// }

// TODO tari.js
// export interface AccountInfo {
//     account: Account;
//     public_key: string;
// }
// export interface Account {
//     name: string | null;
//     address: string;
//     key_index: number;
//     is_default: boolean;
// }
