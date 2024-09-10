use serde::Deserialize;

#[derive(Deserialize, Debug)]
pub(crate) struct Summary {
    pub(crate) connection: Connection,

    pub(crate) hashrate: Hashrate,
    // hugepages: bool,
}

#[derive(Deserialize, Debug)]
pub struct Resources {}

#[derive(Deserialize, Debug)]
pub struct Memory {}

#[derive(Deserialize, Debug)]
pub struct Results {
    // Sometimes this is not present in v6.21.0
    // error_log: Vec<String>,
}

#[derive(Deserialize, Debug)]
pub struct Connection {
    pub(crate) uptime: u64,
    // Sometimes doesn't exist
    // pub(crate) error_log: Vec<String>,
}

#[derive(Deserialize, Debug)]
pub struct Cpu {}

#[derive(Deserialize, Debug)]
pub struct Hashrate {
    pub(crate) total: Vec<Option<f64>>,
}
