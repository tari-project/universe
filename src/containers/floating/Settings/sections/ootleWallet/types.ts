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
