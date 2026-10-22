-- The wallet store schema tari-ootle v0.44.0 creates: its 14 migrations' up.sql in order,
-- recorded as diesel records them. Generated from
-- crates/wallet/storage_sqlite/migrations at tag v0.44.0.

CREATE TABLE IF NOT EXISTS __diesel_schema_migrations (
       version VARCHAR(50) PRIMARY KEY NOT NULL,
       run_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2023-02-08-122514_initial
PRAGMA foreign_keys = ON;

-- Key Manager
CREATE TABLE key_manager_states
(
    id          INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    branch_seed TEXT                              NOT NULL,
    `index`     BIGINT                            NOT NULL,
    is_active   BOOLEAN                           NOT NULL,
    created_at  DATETIME                          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME                          NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX key_manager_states_uniq_branch_seed_index on key_manager_states (branch_seed, `index`);

CREATE TABLE key_manager_imported_keys
(
    id               INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    label            TEXT                              NOT NULL,
    encrypted_secret BLOB                              NOT NULL,
    key_type         TEXT                              NOT NULL,
    created_at       DATETIME                          NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX key_manager_imported_keys_uniq_label on key_manager_imported_keys (label);


-- Config

CREATE TABLE config
(
    id           INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    key          TEXT                              NOT NULL,
    value        TEXT                              NOT NULL,
    is_encrypted BOOLEAN                           NOT NULL,
    created_at   DATETIME                          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME                          NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX config_uniq_key on config (key);

-- Transaction
CREATE TABLE transactions
(
    id                    INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    transaction_id        TEXT     NOT NULL,
    transaction_json      TEXT     NOT NULL,
    referenced_components TEXT     NOT NULL,
    signers               TEXT     NOT NULL,
    result                TEXT     NULL,
    qcs                   TEXT     NULL,
    final_fee             BIGINT   NULL,
    status                TEXT     NOT NULL,
    dry_run               BOOLEAN  NOT NULL,
    executed_time_ms      BIGINT   NULL,
    finalized_time        DATETIME NULL,
    new_account_info      TEXT     NULL,
    invalid_reason        TEXT     NULL,
    created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX transactions_transaction_id_uniq ON transactions (transaction_id);
CREATE INDEX transactions_idx_status ON transactions (status);

-- Substates
CREATE TABLE substates
(
    id                   INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    module_name          TEXT     NULL,
    address              TEXT     NOT NULL,
    parent_address       TEXT     NULL,
    referenced_substates TEXT     NOT NULL,
    version              INTEGER  NOT NULL,
    template_address     TEXT     NULL,
    created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX substates_uniq_address ON substates (address);

-- Accounts
CREATE TABLE accounts
(
    id                    INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    name                  TEXT     NULL,
    address               TEXT     NOT NULL,
    owner_public_key      TEXT     NOT NULL,
    view_only_key_id      TEXT     NOT NULL,
    owner_key_id          TEXT     NULL,
    birthday_epoch        BIGINT   NOT NULL,
    is_default            BOOLEAN  NOT NULL DEFAULT 0,
    is_confirmed_on_chain BOOLEAN  NOT NULL,
    stealth_resources     TEXT     NOT NULL DEFAULT '[]',
    created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX accounts_uniq_address ON accounts (address);
CREATE UNIQUE INDEX accounts_uniq_owner_public_key ON accounts (owner_public_key);
CREATE UNIQUE INDEX accounts_uniq_name ON accounts (name) WHERE name IS NOT NULL;

-- Vaults
CREATE TABLE vaults
(
    id                   INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    account_id           INTEGER  NOT NULL REFERENCES accounts (id),
    address              TEXT     NOT NULL,
    resource_address     TEXT     NOT NULL,
    resource_type        TEXT     NOT NULL,
    revealed_balance     TEXT     NOT NULL DEFAULT '0',
    confidential_balance TEXT     NOT NULL DEFAULT '0',
    token_symbol         TEXT     NULL,
    divisibility         INTEGER  NOT NULL DEFAULT 0,
    created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX vaults_uniq_address ON vaults (address);

-- Resources
CREATE TABLE resources
(
    id            INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    address       TEXT     NOT NULL,
    resource_type TEXT     NOT NULL,
    -- MIGRATION: removed
    owner_key     TEXT     NULL,
    owner_rule    TEXT     NOT NULL,
    access_rules  TEXT     NOT NULL,
    token_symbol  TEXT     NULL,
    divisibility  INTEGER  NOT NULL,
    metadata      TEXT     NOT NULL,
    total_supply  TEXT     NULL,
    view_key      TEXT     NULL,
    auth_hook     TEXT     NULL,

    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX resources_uniq_address ON resources (address);

-- Confidential Outputs
CREATE TABLE confidential_outputs
(
    id                  INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    account_id          INTEGER  NOT NULL REFERENCES accounts (id),
    vault_id            INTEGER  NOT NULL REFERENCES vaults (id),
    commitment          TEXT     NOT NULL,
    value               BIGINT   NOT NULL,
    sender_public_nonce TEXT     NULL,
    view_only_key_id    TEXT     NOT NULL,
    owner_key_id        TEXT     NULL,
    public_asset_tag    TEXT     NULL,
    memo_json           TEXT     NULL,
    -- Status can be "Unspent", "Spent", "Locked", "LockedUnconfirmed", "Invalid"
    status              TEXT     NOT NULL,
    locked_at           DATETIME NULL,
    lock_id             INTEGER  NULL,
    encrypted_data      blob     NOT NULL DEFAULT '',
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX confidential_outputs_uniq_commitment ON confidential_outputs (commitment);
CREATE INDEX confidential_outputs_idx_account_status ON confidential_outputs (account_id, status);

-- Locks
CREATE TABLE locks
(
    id             INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT     NULL,
    timeout_at     DATETIME NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX locks_uniq_transaction_id ON locks (transaction_id) WHERE transaction_id IS NOT NULL;

-- Vault locks
CREATE TABLE vault_locks
(
    id         INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    vault_id   INTEGER  NOT NULL REFERENCES vaults (id) ON DELETE CASCADE,
    lock_id    INTEGER  NOT NULL REFERENCES locks (id) ON DELETE CASCADE,
    -- MIGRATION: changed to a string
    amount     BIGINT   NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX vault_locks_uniq_vault_lock ON vault_locks (vault_id, lock_id);

-- NFTs
CREATE TABLE non_fungible_tokens
(
    id           INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    vault_id     INTEGER  NOT NULL REFERENCES vaults (id),
    nft_id       TEXT     NOT NULL,
    resource_id  text     NOT NULL,
    data         TEXT     NOT NULL,
    mutable_data TEXT     NOT NULL,
    is_burnt     BOOLEAN  NOT NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX nfts_uniq_address ON non_fungible_tokens (nft_id);
CREATE UNIQUE INDEX nfts_uniq_address_vault_id_uniq_idx ON non_fungible_tokens (nft_id, vault_id);

CREATE TABLE authored_templates
(
    id                INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    author_public_key TEXT     NOT NULL,
    address           TEXT     NOT NULL,
    name              TEXT     NOT NULL,
    abi_version       INTEGER  NOT NULL,
    functions         TEXT     NOT NULL,
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE webauthn_registrations
(
    id         INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    username   TEXT     NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX webauthn_regs_usernames ON webauthn_registrations (username);

CREATE TABLE webauthn_registration_passkeys
(
    id              INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    registration_id INTEGER  NOT NULL REFERENCES webauthn_registrations (id),
    passkey         BLOB     NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Stealth Outputs
CREATE TABLE stealth_outputs
(
    id                     INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    owner_account_id       INTEGER  NOT NULL REFERENCES accounts (id),
    resource_address       TEXT     NOT NULL,
    commitment             TEXT     NOT NULL,
    value                  BIGINT   NOT NULL,
    sender_public_nonce    TEXT     NOT NULL,
    -- Status can be "Unspent", "Spent", "Locked", "LockedUnconfirmed", "Invalid"
    status                 TEXT     NOT NULL,
    locked_at              DATETIME NULL,
    lock_id                INTEGER  NULL,
    view_only_key_id       TEXT     NOT NULL,
    owner_key_id           TEXT     NULL,
    encrypted_data         BLOB     NOT NULL DEFAULT '',
    tag_byte               INTEGER  NOT NULL,
    memo_json              TEXT     NULL,
    -- Spend authorisation (TIP-0006): at least one of spend_key / condition_root is set.
    spend_key              TEXT     NULL,
    condition_root         TEXT     NULL,
    minimum_value_promise  BIGINT   NOT NULL,
    is_burnt               BOOLEAN  NOT NULL DEFAULT 0,
    is_frozen              BOOLEAN  NOT NULL DEFAULT 0,
    is_on_chain            BOOLEAN  NOT NULL,
    is_condition_spendable BOOLEAN  NOT NULL,
    created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Mirror the SpendAuthorization enum: an output must be spendable by at least one path.
    CHECK (spend_key IS NOT NULL OR condition_root IS NOT NULL)
);

CREATE UNIQUE INDEX stealth_outputs_uniq_resource_addr_commitment ON stealth_outputs (resource_address, commitment);
CREATE INDEX stealth_outputs_idx_resource_status ON stealth_outputs (resource_address, status);

-- Shard State Versions
CREATE TABLE shard_state_versions
(
    id            INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    account_id    INTEGER  NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    resource_id   INTEGER  NOT NULL REFERENCES resources (id) ON DELETE CASCADE,
    shard         INTEGER  NOT NULL,
    state_version BIGINT   NOT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX shard_state_versions_account_resource_shard_uniq ON shard_state_versions (account_id, resource_id, shard);
CREATE INDEX shard_state_versions_account_resource_shard_state_version_idx ON shard_state_versions (account_id, resource_id, shard, state_version);

-- UTXO process queue
CREATE TABLE utxo_process_queue
(
    id               INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    account_id       INTEGER  NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    resource_address TEXT     NOT NULL,
    utxo_tag         INT      NOT NULL,
    public_nonce     TEXT     NOT NULL,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX utxo_process_queue_account_resource_tag_nonce_uniq
    ON utxo_process_queue (account_id, resource_address, utxo_tag, public_nonce);

CREATE TABLE wallet_events
(
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER  NULL,
    event_type TEXT     NOT NULL,
    event_data TEXT     NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE NO ACTION
);

CREATE INDEX idx_wallet_events_account_id ON wallet_events (account_id) where account_id IS NOT NULL;
CREATE INDEX idx_wallet_events_event_type ON wallet_events (event_type);

INSERT INTO __diesel_schema_migrations (version) VALUES ('20230208122514');

-- 2026-02-23-081528_remove_owner_key
-- Remove ownerkey column from the resources table
ALTER TABLE resources
    DROP COLUMN owner_key;
INSERT INTO __diesel_schema_migrations (version) VALUES ('20260223081528');

-- 2026-02-26-054039_vault_locks_amount_as_string
-- Disable foreign key constraints temporarily to allow for table alteration
PRAGMA foreign_keys = OFF;

-- Convert vault_locks.amount from integer to string
ALTER TABLE vault_locks
    RENAME TO vault_locks_old;

CREATE TABLE vault_locks
(
    id         INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    vault_id   INTEGER  NOT NULL REFERENCES vaults (id) ON DELETE CASCADE,
    lock_id    INTEGER  NOT NULL REFERENCES locks (id) ON DELETE CASCADE,
    amount     TEXT     NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO vault_locks (id, vault_id, lock_id, amount, created_at)
SELECT id, vault_id, lock_id, CAST(amount AS TEXT), created_at
FROM vault_locks_old;

DROP TABLE vault_locks_old;

-- Re-enable foreign key constraints
PRAGMA foreign_keys = ON;
INSERT INTO __diesel_schema_migrations (version) VALUES ('20260226054039');

-- 2026-03-03-065935_update_token_symbol
-- Update resources

UPDATE resources
SET token_symbol = 'tTARI',
    metadata     = json_set(metadata, '$.SYMBOL', 'tTARI')
WHERE address = 'resource_0101010101010101010101010101010101010101010101010101010101010101'
  AND token_symbol = 'tXTR';

-- Update vaults

UPDATE vaults
SET token_symbol = 'tTARI'
WHERE resource_address = 'resource_0101010101010101010101010101010101010101010101010101010101010101'
  AND token_symbol = 'tXTR';

INSERT INTO __diesel_schema_migrations (version) VALUES ('20260303065935');

-- 2026-04-10-120000_address_book
CREATE TABLE address_book (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    address TEXT NOT NULL,
    note TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);

INSERT INTO __diesel_schema_migrations (version) VALUES ('20260410120000');

-- 2026-05-12-090000_api_keys
-- API keys issued by an Admin user, used by AI agents / other automated
-- clients to authenticate against the wallet daemon's JSON-RPC API without
-- requiring an interactive webauthn ceremony.
--
-- Security:
--   * Only the SHA-256 hash of the key material is persisted. The raw key
--     is returned to the admin exactly once at creation time and is never
--     recoverable from the database.
--   * Granted permissions are stored as a comma-separated string in the
--     same format as `Permissions`'s `FromStr`/`Display`.
--   * Revocation is soft (`revoked_at`) so we can still log a "last seen"
--     timestamp for already-revoked credentials; queries filter on this.
--   * `expires_at` is a forward-compatibility hook: the auth path will
--     eventually treat any row whose `expires_at` lies in the past as
--     unusable. For the initial implementation it is always written as
--     NULL, but the column exists so adding the enforcement later is a
--     pure code change rather than a follow-up migration.
CREATE TABLE api_keys (
    id              INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    name            TEXT     NOT NULL,
    key_hash        TEXT     NOT NULL,
    permissions     TEXT     NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at    DATETIME NULL,
    revoked_at      DATETIME NULL,
    expires_at      DATETIME NULL
);

CREATE UNIQUE INDEX api_keys_key_hash_idx ON api_keys (key_hash);
CREATE INDEX        api_keys_name_idx     ON api_keys (name);

INSERT INTO __diesel_schema_migrations (version) VALUES ('20260512090000');

-- 2026-05-22-100000_api_keys_new_grammar
-- The Permission redesign changes the wire/storage grammar from the old
-- PascalCase variants (`AccountInfo`, `TransactionSend_<id>`, ...) to a
-- lowercase `<resource>:<action>[:<entity>]` form (`accounts:read`,
-- `transfer:create:component_…`, ...). Existing rows would fail to
-- re-parse on the next authentication, so we drop them. Ootle is
-- pre-launch — admins re-mint with `wallet auth api-key create` using
-- the new grammar.
--
-- Schema is identical to the prior migration; only contents reset.
DROP INDEX IF EXISTS api_keys_name_idx;
DROP INDEX IF EXISTS api_keys_key_hash_idx;
DROP TABLE IF EXISTS api_keys;

CREATE TABLE api_keys (
    id              INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    name            TEXT     NOT NULL,
    key_hash        TEXT     NOT NULL,
    permissions     TEXT     NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at    DATETIME NULL,
    revoked_at      DATETIME NULL,
    expires_at      DATETIME NULL
);

CREATE UNIQUE INDEX api_keys_key_hash_idx ON api_keys (key_hash);
CREATE INDEX        api_keys_name_idx     ON api_keys (name);

INSERT INTO __diesel_schema_migrations (version) VALUES ('20260522100000');

-- 2026-05-29-100000_transaction_accounts
-- Links a submitted transaction to the wallet account(s) it involves, so the
-- transactions list can be filtered per account.
--
-- A transaction may involve more than one owned account (e.g. a transfer from
-- account A to the wallet's own account B tags both), hence a join table rather
-- than a column on `transactions`. Tagging is done explicitly at submission time
-- by the handler that knows the involved accounts; stealth transactions are not
-- identifiable from on-chain data, so this is the only reliable linkage.
--
-- Only non-dry-run, wallet-submitted transactions are linked. Received funds are
-- discovered by scanning (not yet implemented) and are not represented here.
CREATE TABLE transaction_accounts (
    id             INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT    NOT NULL REFERENCES transactions (transaction_id) ON DELETE CASCADE,
    account_id     INTEGER NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT transaction_accounts_uniq UNIQUE (transaction_id, account_id)
);

CREATE INDEX transaction_accounts_account_idx ON transaction_accounts (account_id);

INSERT INTO __diesel_schema_migrations (version) VALUES ('20260529100000');

-- 2026-06-18-160000_account_balance_changes
CREATE TABLE account_balance_changes
(
    id                  INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    account_id          INTEGER  NOT NULL,
    resource_id         INTEGER  NOT NULL,
    account_address     TEXT     NOT NULL,
    vault_address       TEXT     NULL,
    vault_version       BIGINT   NULL,
    resource_address    TEXT     NOT NULL,
    token_symbol        TEXT     NULL,
    divisibility        INTEGER  NOT NULL,
    source_type         TEXT     NOT NULL CHECK (source_type IN ('transaction', 'scan', 'recovery')),
    transaction_id      TEXT     NULL,
    revealed_before     TEXT     NOT NULL,
    revealed_after      TEXT     NOT NULL,
    confidential_before TEXT     NOT NULL,
    confidential_after  TEXT     NOT NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (source_type = 'transaction' AND transaction_id IS NOT NULL) OR
        (source_type IN ('scan', 'recovery') AND transaction_id IS NULL)
    ),
    CHECK (
        (vault_address IS NULL AND vault_version IS NULL) OR
        (vault_address IS NOT NULL AND vault_version IS NOT NULL)
    ),
    CHECK (revealed_before <> revealed_after OR confidential_before <> confidential_after),
    CHECK (divisibility BETWEEN 0 AND 255)
);

CREATE INDEX account_balance_changes_account_created_idx
    ON account_balance_changes (account_id, created_at DESC, id DESC);
CREATE INDEX account_balance_changes_account_resource_created_idx
    ON account_balance_changes (account_id, resource_id, created_at DESC, id DESC);
CREATE INDEX account_balance_changes_vault_idx ON account_balance_changes (vault_address);
CREATE INDEX account_balance_changes_transaction_idx ON account_balance_changes (transaction_id);
CREATE UNIQUE INDEX account_balance_changes_account_resource_transaction_uniq
    ON account_balance_changes (account_id, resource_id, transaction_id)
    WHERE transaction_id IS NOT NULL;
CREATE UNIQUE INDEX account_balance_changes_vault_version_uniq
    ON account_balance_changes (vault_address, vault_version)
    WHERE vault_address IS NOT NULL AND vault_version IS NOT NULL;

INSERT INTO __diesel_schema_migrations (version) VALUES ('20260618160000');

-- 2026-06-25-150000_vault_version
ALTER TABLE vaults ADD COLUMN vault_version INTEGER NOT NULL DEFAULT 0;

INSERT INTO __diesel_schema_migrations (version) VALUES ('20260625150000');

-- 2026-07-01-143000_balance_change_address_indexes
DROP INDEX IF EXISTS account_balance_changes_account_created_idx;
DROP INDEX IF EXISTS account_balance_changes_account_resource_created_idx;

CREATE INDEX account_balance_changes_account_created_idx
    ON account_balance_changes (account_address, created_at DESC, id DESC);
CREATE INDEX account_balance_changes_account_resource_created_idx
    ON account_balance_changes (account_address, resource_address, created_at DESC, id DESC);

INSERT INTO __diesel_schema_migrations (version) VALUES ('20260701143000');

-- 2026-07-09-120000_imported_key_public_key
-- The public key derived from the imported secret is the stable identity of an imported key; the label is a
-- mutable display name. Key uniqueness/idempotency is therefore on the public key, not the label.
DROP INDEX key_manager_imported_keys_uniq_label;

ALTER TABLE key_manager_imported_keys
    ADD COLUMN public_key TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX key_manager_imported_keys_uniq_public_key
    ON key_manager_imported_keys (public_key);

INSERT INTO __diesel_schema_migrations (version) VALUES ('20260709120000');

-- 2026-07-15-100000_transaction_requests
-- Transaction requests created by a limited-permission tool, approved by a
-- separately-permissioned principal, and only then submitted (issue #2343).
--
-- Why a table of its own rather than columns on `transactions`:
--   * `transactions.status` tracks the consensus lifecycle. A request that is
--     never approved never becomes a transaction at all, so it has no place
--     in that lifecycle.
--   * A request is the artifact a human authorises. It must be durable across
--     restarts, which rules out the in-memory `RefreshTokenStore` shape.
--
-- Invariants:
--   * `unsigned_transaction` is the transaction frozen at creation, stored as
--     JSON like `transactions.transaction_json`: inputs already detected and
--     `is_seal_signer_authorized` already settled to the value `seal()` will
--     produce. It is immutable once written, so the approver views exactly what
--     submit seals.
--   * `seal_signer` / `other_signers` are the caller's choice of who pays and
--     co-signs. Stealth spend keys are deliberately absent: they are derived
--     at submit from the `lock_ids` below, so a caller cannot ask the wallet
--     to sign with a key of its choosing.
--   * `requested_by` is the admin-assigned name of the API key that created
--     the request, or NULL for a wallet session. Display and audit only --
--     nothing authorises on it, and no creator check gates approval.
--   * `expires_at` bounds the approval window. Expiry is *derived* on read
--     rather than written by a reaper: a row still marked Pending past this
--     timestamp is expired. The locks referenced by `lock_ids` are extended
--     past this deadline at creation, so the lock always outlives the request.
CREATE TABLE transaction_requests (
    id                   INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    unsigned_transaction TEXT     NOT NULL,
    seal_signer          TEXT     NOT NULL,
    other_signers        TEXT     NOT NULL,
    signatures           TEXT     NOT NULL,
    lock_ids             TEXT     NOT NULL,
    requested_by         TEXT     NULL,
    status               TEXT     NOT NULL,
    transaction_id       TEXT     NULL,
    expires_at           DATETIME NOT NULL,
    approved_at          DATETIME NULL,
    created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX transaction_requests_status_idx ON transaction_requests (status);

INSERT INTO __diesel_schema_migrations (version) VALUES ('20260715100000');

-- 2026-09-23-000000_substate_version_u64
-- Widen the wallet's substate version columns to hold a u64.
--
-- A version counts one write per transaction that touches the substate, so its ceiling is a
-- throughput ceiling on a single contended substate, not a calendar one. The column must hold the
-- full range the protocol admits, which a signed 32-bit integer does not.
--
-- SQLite cannot change a column's declared type in place, and a table rebuild is not available here:
-- `vaults` is a foreign key target, and inside the transaction a migration runs in, renaming it
-- repoints every referencing table at the temporary name. Adding the wider column and dropping the
-- narrow one leaves those references untouched. Both columns move to the end of their table as a
-- result, which is where the generated schema expects them.

ALTER TABLE substates ADD COLUMN version_wide BIGINT NOT NULL DEFAULT 0;
UPDATE substates SET version_wide = version;
ALTER TABLE substates DROP COLUMN version;
ALTER TABLE substates RENAME COLUMN version_wide TO version;

ALTER TABLE vaults ADD COLUMN vault_version_wide BIGINT NOT NULL DEFAULT 0;
UPDATE vaults SET vault_version_wide = vault_version;
ALTER TABLE vaults DROP COLUMN vault_version;
ALTER TABLE vaults RENAME COLUMN vault_version_wide TO vault_version;

INSERT INTO __diesel_schema_migrations (version) VALUES ('20260923000000');
