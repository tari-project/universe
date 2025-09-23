use std::path::{Path, PathBuf};

use crate::wallet::wallet_types::{
    ChainId, Currency, TransactionInfo, TransactionStatus, WalletEvent, WalletInfo,
};
use sqlx::{Connection, FromRow, SqliteConnection};

#[derive(Clone)]
pub(crate) struct WalletDb {
    path: String,
}

impl WalletDb {
    pub fn new(path: &Path) -> Self {
        WalletDb {
            path: path.to_string_lossy().into_owned(),
        }
    }

    async fn create_connection(&self) -> Result<SqliteConnection, anyhow::Error> {
        let mut conn = SqliteConnection::connect(&self.path).await?;
        sqlx::migrate!("./migrations").run_direct(&mut conn).await?;
        Ok(conn)
    }

    pub async fn get_transactions(
        &self,
        offset: Option<u32>,
        limit: Option<u32>,
        status_bitflag: Option<u32>,
    ) -> Result<Vec<TransactionInfo>, anyhow::Error> {
        let mut conn = self.create_connection().await?;
        let (limit, offset) = (limit.map(|l| l as i32), offset.map(|o| o as i32));
        let rows = sqlx::query_as!(
            TransactionRow,
            "SELECT 
         id,
         credit_amount,
         debit_amount,
         description,
         wallet_id,
         source_address,
         destination_address,
         chain_output_id,
         chain_height,
         chain_block_hash,
         chain_time,
         is_deleted,
         created_at 
         FROM transactions
         where is_deleted = 0
         ORDER BY chain_time DESC
         LIMIT ? OFFSET ?
         ",
            limit,
            offset
        )
        .fetch_all(&mut conn)
        .await?;

        Ok(rows
            .into_iter()
            .map(|r| TransactionInfo {
                id: r.id as u32,
                source_address: r.source_address.unwrap_or_default(),
                dest_address: r.destination_address.unwrap_or_default(),
                status: TransactionStatus::MinedConfirmed,
                amount: (r.credit_amount - r.debit_amount) as u64,
                currency: Currency::Xtm,
                wallet_id: r.wallet_id as u32,
                is_cancelled: false,
                direction: if r.credit_amount > 0 { 1 } else { 0 },
                excess_sig: vec![],
                fee: 0,
                timestamp: r.chain_time.timestamp() as u64,
                payment_id: "".to_string(),
                payment_reference: None,
                mined_in_block_height: r.chain_height as u64,
                mined_in_chain_id: ChainId("Minotari".to_string()),
            })
            .collect())
    }

    pub async fn get_all_wallets(&self) -> Result<Vec<WalletInfo>, anyhow::Error> {
        let mut conn = self.create_connection().await?;
        let rows = sqlx::query_as!(
            WalletRow,
            "SELECT 
            id,
            name,
            currency_symbol,
            decimal_places,
            view_key_reference,
            chain_id,
            chain_resource_id,
            chain_birthday_height,
            last_scanned_height,
            last_scanned_hash,
            created_at
         FROM wallets"
        )
        .fetch_all(&mut conn)
        .await?;
        Ok(rows
            .into_iter()
            .map(|r| WalletInfo {
                id: r.id,
                name: r.name,
                view_key_reference: r.view_key_reference,
                chain_id: ChainId(r.chain_id),
                chain_birthday_height: r.chain_birthday_height as u64,
                last_scanned_height: r.last_scanned_height.map(|h| h as u64),
                last_scanned_hash: r.last_scanned_hash,
            })
            .collect())
    }

    pub async fn apply_event(
        &self,
        wallet_id: i64,
        event: WalletEvent,
    ) -> Result<(), anyhow::Error> {
        todo!("Implement apply_event");
        // let mut conn = self.create_connection().await?;
        // sqlx::query!(
        //     "INSERT INTO wallet_events (wallet_id, event_type, event_data) VALUES (?, ?, ?)",
        //     wallet_id,
        //     event.event_type,
        //     event.event_data
        // )
        // .execute(&mut conn)
        // .await?;
        Ok(())
    }

    pub async fn update_last_sync_info(
        &self,
        wallet_id: i64,
        last_scanned_height: u64,
        last_scanned_block: Option<Vec<u8>>,
    ) -> Result<(), anyhow::Error> {
        todo!("Implement update_last_sync_info");
    }
}

#[derive(Debug, FromRow)]
struct TransactionRow {
    id: i64,
    credit_amount: i64,
    debit_amount: i64,
    description: String,
    wallet_id: i64,
    source_address: Option<String>,
    destination_address: Option<String>,
    chain_output_id: Vec<u8>,
    chain_height: i64,
    chain_block_hash: Vec<u8>,
    chain_time: chrono::NaiveDateTime,
    is_deleted: bool,
    created_at: chrono::NaiveDateTime,
}
#[derive(Debug, FromRow)]
pub(crate) struct WalletRow {
    pub id: i64,
    pub name: String,
    currency_symbol: String,
    decimal_places: i64,
    pub view_key_reference: String,
    pub chain_id: String,
    chain_resource_id: Option<String>,
    pub chain_birthday_height: i64,
    pub last_scanned_height: Option<i64>,
    pub last_scanned_hash: Option<Vec<u8>>,
    created_at: chrono::NaiveDateTime,
}
