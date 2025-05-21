// based on the enum from tari.rpc.rs - update this file if there are changes there!

// DO not change the order
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

export enum StatusMapped {
    Completed = 'Completed',
    Broadcast = 'Broadcast',
    MinedUnconfirmed = 'MinedUnconfirmed',
    Imported = 'Imported',
    Pending = 'Pending',
    Coinbase = 'Coinbase',
    MinedConfirmed = 'MinedConfirmed',
    Rejected = 'Rejected',
    OneSidedUnconfirmed = 'OneSidedUnconfirmed',
    OneSidedConfirmed = 'OneSidedConfirmed',
    Queued = 'Queued',
    NotFound = 'NotFound',
    CoinbaseUnconfirmed = 'CoinbaseUnconfirmed',
    CoinbaseConfirmed = 'CoinbaseConfirmed',
    CoinbaseNotInBlockChain = 'CoinbaseNotInBlockChain',
}

export enum TransactionDirection {
    Inbound = 1,
    Outbound = 2,
}
