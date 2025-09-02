-- CREATE TABLE ViewKeys (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     private_view_key_encrypted BLOB NOT NULL,
--     public_spend_key_encrypted BLOB NOT NULL,
--     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
-- )


CREATE TABLE Wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    currency_symbol TEXT NOT NULL, 
    decimal_places INTEGER NOT NULL,
    view_key_reference TEXT NOT NULL ,
    chain_id TEXT NOT NULL,
    chain_resource_id TEXT NULL,
    chain_birthday_height INTEGER NOT NULL,
    last_scanned_height INTEGER NULL,
    last_scanned_hash BLOB NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    credit_amount INTEGER NOT NULL,
    debit_amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    wallet_id INTEGER NOT NULL REFERENCES Wallets(id),
    source_address TEXT NULL,
    destination_address TEXT NULL,
    chain_output_id BLOB NOT NULL,
    chain_height INTEGER NOT NULL,
    chain_block_hash BLOB NOT NULL,
    chain_time TIMESTAMP NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP 
);

CREATE TABLE WalletEvents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    event_data JSON NOT NULL,
    wallet_id INTEGER NOT NULL REFERENCES Wallets(id),
    chain_height INTEGER NOT NULL,
    chain_hash BLOB NOT NULL,
    chain_timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);