use std::thread;

#[cfg(target_os = "windows")]
fn get_total_logical_cores() -> usize {
    use windows_sys::Win32::System::SystemInformation::{GetActiveProcessorCount, ALL_PROCESSOR_GROUPS};
    
    // GetActiveProcessorCount com 0xFFFF (ALL_PROCESSOR_GROUPS) retorna o total em todos os grupos
    let count = unsafe { GetActiveProcessorCount(ALL_PROCESSOR_GROUPS) };
    if count == 0 {
        // Fallback para o comportamento padrão caso a API falhe
        thread::available_parallelism().map(|n| n.get()).unwrap_or(1)
    } else {
        count as usize
    }
}

#[cfg(not(target_os = "windows"))]
fn get_total_logical_cores() -> usize {
    thread::available_parallelism().map(|n| n.get()).unwrap_or(1)
}

/// Determina o número de cores a serem usados baseando-se na capacidade total do hardware
/// e na seleção do usuário, removendo o limite de 64 no Windows.
pub fn determine_number_of_cores_to_use(user_selected_threads: Option<usize>) -> usize {
    let total_cores = get_total_logical_cores();
    
    match user_selected_threads {
        Some(threads) if threads > 0 && threads <= total_cores => threads,
        Some(threads) if threads > total_cores => total_cores,
        _ => {
            // Lógica padrão: usar 50% dos cores se não especificado, ou conforme regra de negócio
            (total_cores / 2).max(1)
        }
    }
}
