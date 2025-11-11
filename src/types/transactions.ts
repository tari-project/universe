// based on the enums from tari.rpc.rs - update this file if there are changes there!

export enum TransactionDirection {
    Inbound = 1,
    Outbound = 2,
}

export enum TransactionStatus {
    Completed = 0,
    Broadcast = 1,
    MinedUnconfirmed = 2,
    Imported = 3,
    Pending = 4,
    Coinbase = 5,
    MinedConfirmed = 6,
    Rejected = 7,
    OneSidedUnconfirmed = 8,
    OneSidedConfirmed = 9,
    Queued = 10,
    NotFound = 11,
    CoinbaseUnconfirmed = 12,
    CoinbaseConfirmed = 13,
    CoinbaseNotInBlockChain = 14,
}

export enum WalletAddressNetwork {
    Ethereum,
    Tari,
}
