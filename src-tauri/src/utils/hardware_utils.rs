pub(crate) enum CpuCategory {
    Unknown,
    LowEnd,
    MidEnd,
    HighEnd,
}

pub(crate) fn get_cpu_category() -> CpuCategory {
    let cores = num_cpus::get_physical();
    if cores <= 4 {
        CpuCategory::LowEnd
    } else if cores <= 8 {
        CpuCategory::MidEnd
    } else {
        CpuCategory::HighEnd
    }
}
