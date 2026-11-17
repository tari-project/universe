// Nota: O arquivo original usa determine_number_of_cores_to_use do manager.rs
// Asseguramos que o parâmetro --threads receba o valor sem truncamento.

pub fn build_xmrig_args(cpu_threads: usize, config: &CpuMiningConfig) -> Vec<String> {
    let mut args = vec![
        "--threads".to_string(),
        cpu_threads.to_string(),
        // ... outros argumentos
    ];
    
    // XMRig 6.25.0 detecta grupos de processadores automaticamente no Windows.
    // Ao passarmos um valor > 64 em `cpu_threads`, o XMRig tentará alocar
    // em múltiplos grupos se a topologia permitir.
    
    args
}
