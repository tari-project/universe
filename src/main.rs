use std::thread;
use std::sync::atomic::{AtomicUsize, Ordering};
use windows_sys::Win32::System::Threading::*;

fn main() {
    let num_logical_cores = count_logical_cores();
    println!("Number of logical cores: {}", num_logical_cores);

    let num_threads = if num_logical_cores > 64 { num_logical_cores } else { 64 };
    let thread_count = AtomicUsize::new(0);

    for i in 0..num_threads {
        let thread_count = thread_count.clone();
        thread::spawn(move || {
            let group_index = (i / 64) as u16;
            let group_mask = GROUP_AFFINITY {
                Mask: 1 << (i % 64),
                Group: group_index,
                Reserved: [0; 3],
                Affinity: 0,
            };

            unsafe {
                SetThreadGroupAffinity(GetCurrentThread(), &group_mask, None);
            }

            // Simulate some work
            let my_id = thread_count.fetch_add(1, Ordering::Relaxed) + 1;
            println!("Thread {} is running on group {}", my_id, group_index);
        });
    }

    // Wait for all threads to finish
    for _ in 0..num_threads {
        thread::park();
    }
}

fn count_logical_cores() -> usize {
    let mut system_info = SYSTEM_INFO::default();
    unsafe {
        GetSystemInfo(&mut system_info as *mut _);
    }

    let active_processor_count = system_info.dwNumberOfProcessors as usize;

    if active_processor_count <= 64 {
        return active_processor_count;
    }

    let mut group_count = 0;
    unsafe {
        GetLogicalProcessorInformationEx(RelationProcessorCore, None, &mut group_count);
    }

    let mut buffer_size = group_count;
    let mut buffer: Vec<u8> = vec![0; buffer_size];

    unsafe {
        GetLogicalProcessorInformationEx(RelationProcessorCore, buffer.as_mut_ptr() as *mut _, &mut buffer_size);
    }

    let mut total_cores = 0;
    let mut offset = 0;
    while offset < buffer_size {
        let group_info = unsafe { &*(buffer[offset] as *const GROUP_RELATIONSHIP) };
        total_cores += group_info.MaximumGroupActiveProcessorCount as usize;
        offset += group_info.SizeOfStruct as usize;
    }

    total_cores
}
