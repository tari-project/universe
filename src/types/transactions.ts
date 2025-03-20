// from tari.rpc.rs - only the enum members we use for now

export enum TransactionStatus {
    /// This transaction is mined and confirmed at the current base node's height
    MinedConfirmed = 6,
    /// This is faux transaction mainly for one-sided transaction outputs or wallet recovery outputs have been found
    OneSidedUnconfirmed = 8,
    /// All Imported and FauxUnconfirmed transactions will end up with this status when the outputs have been confirmed
    OneSidedConfirmed = 9,
    /// This is Coinbase transaction that is detected from chain
    CoinbaseUnconfirmed = 12,
    /// This is Coinbase transaction that is detected from chain
    CoinbaseConfirmed = 13,
}

export enum TransactionDirection {
    Inbound = 1,
    Outbound = 2,
}
