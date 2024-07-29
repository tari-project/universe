use serde::Deserialize;

#[derive(Deserialize, Debug)]
pub(crate) struct Summary {
    id: String,
    worker_id: String,
    uptime: u64,
    restricted: bool,
    resources: Resources,
    features: Vec<String>,
    results: Results,
    algo: Option<String>,
    pub(crate) connection: Connection,
    version: String,
    kind: String,
    ua: String,
    cpu: Cpu,
    donate_level: u8,
    paused: bool,
    algorithms: Vec<String>,
    pub(crate) hashrate: Hashrate,
    // hugepages: bool,
}

#[derive(Deserialize, Debug)]
pub struct Resources {
    memory: Memory,
    load_average: Vec<f64>,
    hardware_concurrency: u8,
}

#[derive(Deserialize, Debug)]
pub struct Memory {
    free: u64,
    total: u64,
    resident_set_memory: u64,
}

#[derive(Deserialize, Debug)]
pub struct Results {
    diff_current: u64,
    shares_good: u64,
    shares_total: u64,
    avg_time: u64,
    avg_time_ms: u64,
    hashes_total: u64,
    best: Vec<u64>,
    // Sometimes this is not present in v6.21.0
    // error_log: Vec<String>,
}

#[derive(Deserialize, Debug)]
pub struct Connection {
    pool: String,
    ip: Option<String>,
    pub(crate) uptime: u64,
    uptime_ms: u64,
    ping: u64,
    failures: u64,
    tls: Option<String>,
    #[serde(rename = "tls-fingerprint")]
    tls_fingerprint: Option<String>,
    algo: Option<String>,
    diff: u64,
    accepted: u64,
    rejected: u64,
    avg_time: u64,
    avg_time_ms: u64,
    hashes_total: u64,
    // Sometimes doesn't exist
    // pub(crate) error_log: Vec<String>,
}

#[derive(Deserialize, Debug)]
pub struct Cpu {
    brand: String,
    family: u64,
    model: u64,
    stepping: u64,
    proc_info: u64,
    aes: bool,
    avx2: bool,
    x64: bool,
    #[serde(rename = "64_bit")]
    bit_64: bool,
    l2: u64,
    l3: u64,
    cores: u64,
    threads: u64,
    packages: u64,
    nodes: u64,
    backend: String,
    msr: String,
    assembly: String,
    arch: String,
    flags: Vec<String>,
}

#[derive(Deserialize, Debug)]
pub struct Hashrate {
    pub(crate) total: Vec<Option<f64>>,
    highest: Option<f64>,
    threads: Option<Vec<Vec<Option<f64>>>>,
}
