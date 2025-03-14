// from tari.rpc.rs
export enum TransactionStatus {
    /// This transaction has been completed between the parties but has not been broadcast to the base layer network.
    Completed = 0,
    /// This transaction has been broadcast to the base layer network and is currently in one or more base node mempools.
    Broadcast = 1,
    /// This transaction has been mined and included in a block.
    MinedUnconfirmed = 2,
    /// This transaction was generated as part of importing a spendable UTXO
    Imported = 3,
    /// This transaction is still being negotiated by the parties
    Pending = 4,
    /// This is a created Coinbase Transaction
    Coinbase = 5,
    /// This transaction is mined and confirmed at the current base node's height
    MinedConfirmed = 6,
    /// The transaction was rejected by the mempool
    Rejected = 7,
    /// This is faux transaction mainly for one-sided transaction outputs or wallet recovery outputs have been found
    OneSidedUnconfirmed = 8,
    /// All Imported and FauxUnconfirmed transactions will end up with this status when the outputs have been confirmed
    OneSidedConfirmed = 9,
    /// This transaction is still being queued for sending
    Queued = 10,
    /// The transaction was not found by the wallet its in transaction database
    NotFound = 11,
    /// This is Coinbase transaction that is detected from chain
    CoinbaseUnconfirmed = 12,
    /// This is Coinbase transaction that is detected from chain
    CoinbaseConfirmed = 13,
    /// This is Coinbase transaction that is not currently detected as mined
    CoinbaseNotInBlockChain = 14,
}

export enum TransactionDirection {
    Unknown = 0,
    Inbound = 1,
    Outbound = 2,
}
