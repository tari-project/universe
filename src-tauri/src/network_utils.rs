use std::net::TcpListener;

pub(crate) fn get_free_port() -> Option<u16> {
    match TcpListener::bind("127.0.0.1:0") {
        Ok(listener) => listener.local_addr().ok().map(|addr| addr.port()),
        Err(_) => None,
    }
}
