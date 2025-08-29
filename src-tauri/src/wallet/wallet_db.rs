use std::path::PathBuf;

use crate::wallet::wallet_types::TransactionInfo;

#[derive(Clone)]
pub(crate) struct WalletDb {
    path: PathBuf,
}

impl WalletDb {
    pub fn new(path: PathBuf) -> Self {
        WalletDb { path }
    }

    pub async fn get_transactions(&self) -> Result<Vec<TransactionInfo>, String> {
        let conn = SqliteConnection::connect(self.path).await?;
        sqlx::query_as!(
            TransactionRow,
            "SELECT 
         id,
         credit_amount,
         debit_amount,
         description,
         wallet_id,
         chain_output_id,
         chain_height,
         chain_block_hash,
         chain_time,
         is_deleted,
         created_at 
         FROM transactions
         where is_deleted = 0
         ORDER BY chain_time DESC"
        )
        .fetch_all(&conn)
        .await
        .map_err(|e| e.to_string())
    }
}

mod schema {
    #[derive(Debug, FromRow)]
    struct TransactionRow {
        id: i32,
        credit_amount: i32,
        debit_amount: i32,
        description: String,
        wallet_id: i32,
        chain_output_id: Vec<u8>,
        chain_height: i32,
        chain_block_hash: Vec<u8>,
        chain_time: chrono::NaiveDateTime,
        is_deleted: bool,
        created_at: chrono::NaiveDateTime,
    }
}
