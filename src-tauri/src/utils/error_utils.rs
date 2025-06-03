use std::io;

pub fn find_io_error(error: &anyhow::Error) -> Option<&io::Error> {
    for cause in error.chain() {
        if let Some(io_error) = cause.downcast_ref::<io::Error>() {
            return Some(io_error.to_owned());
        }
    }
    None
}
