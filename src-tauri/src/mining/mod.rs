pub mod cpu;
pub mod gpu;
pub mod pools;

#[allow(dead_code)]
pub enum MiningAlgorithm {
    RandomX,
    Sha256,
    C29,
}
