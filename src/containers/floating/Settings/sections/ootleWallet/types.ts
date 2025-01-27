export interface OotleAccount {
    account_id: number;
    address: string;
    public_key: string;
    resources: VaultData[];
}
export interface VaultData {
    type: string;
    balance: number;
    resource_address: string;
    token_symbol: string;
    vault_id: string;
}

export interface AccountInfo {
    account: Account;
    public_key: string;
}
export interface Account {
    name: string | null;
    address: string;
    key_index: number;
    is_default: boolean;
}
