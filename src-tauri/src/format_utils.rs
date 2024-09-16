pub fn format_balance(value: f64) -> String {
    let balance = value / 1_000_000.0;
    if balance >= 1_000_000.0 {
        format!("{:.2}M", balance / 1_000_000.0)
    } else if balance >= 1_000.0 {
        format!("{:.2}k", balance / 1_000.0)
    } else {
        format!("{:.2}", balance)
    }
}
