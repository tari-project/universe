use tokio::sync::watch::{Receiver, Sender};

use crate::process_watcher::ProcessWatcherStats;

pub(crate) struct ProcessStatsCollectorBuilder {
    cpu_miner_tx: Option<Sender<ProcessWatcherStats>>,
    cpu_miner_rx: Receiver<ProcessWatcherStats>,
    gpu_miner_tx: Option<Sender<ProcessWatcherStats>>,
    gpu_miner_rx: Receiver<ProcessWatcherStats>,
    mm_proxy_tx: Option<Sender<ProcessWatcherStats>>,
    mm_proxy_rx: Receiver<ProcessWatcherStats>,
    node_tx: Option<Sender<ProcessWatcherStats>>,
    node_rx: Receiver<ProcessWatcherStats>,
    p2pool_tx: Option<Sender<ProcessWatcherStats>>,
    p2pool_rx: Receiver<ProcessWatcherStats>,
    tor_tx: Option<Sender<ProcessWatcherStats>>,
    tor_rx: Receiver<ProcessWatcherStats>,
    wallet_tx: Option<Sender<ProcessWatcherStats>>,
    wallet_rx: Receiver<ProcessWatcherStats>,
}

impl ProcessStatsCollectorBuilder {
    pub fn new() -> Self {
        let (cpu_miner_tx, cpu_miner_rx) =
            tokio::sync::watch::channel(ProcessWatcherStats::default());
        let (gpu_miner_tx, gpu_miner_rx) =
            tokio::sync::watch::channel(ProcessWatcherStats::default());
        let (mm_proxy_tx, mm_proxy_rx) =
            tokio::sync::watch::channel(ProcessWatcherStats::default());
        let (node_tx, node_rx) = tokio::sync::watch::channel(ProcessWatcherStats::default());
        let (p2pool_tx, p2pool_rx) = tokio::sync::watch::channel(ProcessWatcherStats::default());
        let (tor_tx, tor_rx) = tokio::sync::watch::channel(ProcessWatcherStats::default());
        let (wallet_tx, wallet_rx) = tokio::sync::watch::channel(ProcessWatcherStats::default());

        Self {
            cpu_miner_tx: Some(cpu_miner_tx),
            cpu_miner_rx,
            gpu_miner_tx: Some(gpu_miner_tx),
            gpu_miner_rx,
            mm_proxy_tx: Some(mm_proxy_tx),
            mm_proxy_rx,
            node_tx: Some(node_tx),
            node_rx,
            p2pool_tx: Some(p2pool_tx),
            p2pool_rx,
            tor_tx: Some(tor_tx),
            tor_rx,
            wallet_tx: Some(wallet_tx),
            wallet_rx,
        }
    }

    pub fn take_cpu_miner(&mut self) -> Sender<ProcessWatcherStats> {
        self.cpu_miner_tx
            .take()
            .expect("Cannot take cpu_miner more than once")
    }

    pub fn take_gpu_miner(&mut self) -> Sender<ProcessWatcherStats> {
        self.gpu_miner_tx
            .take()
            .expect("Cannot take gpu_miner more than once")
    }

    pub fn take_mm_proxy(&mut self) -> Sender<ProcessWatcherStats> {
        self.mm_proxy_tx
            .take()
            .expect("Cannot take mm_proxy more than once")
    }

    pub fn take_minotari_node(&mut self) -> Sender<ProcessWatcherStats> {
        self.node_tx
            .take()
            .expect("Cannot take node more than once")
    }

    pub fn take_p2pool(&mut self) -> Sender<ProcessWatcherStats> {
        self.p2pool_tx
            .take()
            .expect("Cannot take p2pool more than once")
    }

    pub fn take_tor(&mut self) -> Sender<ProcessWatcherStats> {
        self.tor_tx.take().expect("Cannot take tor more than once")
    }

    pub fn take_wallet(&mut self) -> Sender<ProcessWatcherStats> {
        self.wallet_tx
            .take()
            .expect("Cannot take wallet more than once")
    }

    pub fn build(self) -> ProcessStatsCollector {
        ProcessStatsCollector {
            cpu_miner_rx: self.cpu_miner_rx,
            gpu_miner_rx: self.gpu_miner_rx,
            mm_proxy_rx: self.mm_proxy_rx,
            node_rx: self.node_rx,
            p2pool_rx: self.p2pool_rx,
            tor_rx: self.tor_rx,
            wallet_rx: self.wallet_rx,
        }
    }
}

#[derive(Clone)]
pub(crate) struct ProcessStatsCollector {
    cpu_miner_rx: Receiver<ProcessWatcherStats>,
    gpu_miner_rx: Receiver<ProcessWatcherStats>,
    mm_proxy_rx: Receiver<ProcessWatcherStats>,
    node_rx: Receiver<ProcessWatcherStats>,
    p2pool_rx: Receiver<ProcessWatcherStats>,
    tor_rx: Receiver<ProcessWatcherStats>,
    wallet_rx: Receiver<ProcessWatcherStats>,
}

impl ProcessStatsCollector {
    pub fn get_p2pool_stats(&self) -> ProcessWatcherStats {
        self.p2pool_rx.borrow().clone()
    }

    pub fn get_cpu_miner_stats(&self) -> ProcessWatcherStats {
        self.cpu_miner_rx.borrow().clone()
    }

    pub fn get_gpu_miner_stats(&self) -> ProcessWatcherStats {
        self.gpu_miner_rx.borrow().clone()
    }
    pub fn get_mm_proxy_stats(&self) -> ProcessWatcherStats {
        self.mm_proxy_rx.borrow().clone()
    }

    pub fn get_minotari_node_stats(&self) -> ProcessWatcherStats {
        self.node_rx.borrow().clone()
    }

    pub fn get_tor_stats(&self) -> ProcessWatcherStats {
        self.tor_rx.borrow().clone()
    }

    pub fn get_wallet_stats(&self) -> ProcessWatcherStats {
        self.wallet_rx.borrow().clone()
    }
}
