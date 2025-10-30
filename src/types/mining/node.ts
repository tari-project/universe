export type NodeType = 'Local' | 'Remote' | 'RemoteUntilLocal' | 'LocalAfterRemote';
export interface NodeIdentity {
    public_key: string;
    public_addresses: string[];
}
