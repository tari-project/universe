use axum::http::HeaderValue;
use std::str::FromStr;

#[derive(Debug, Clone)]
pub struct TappletCsp(String);

impl Default for TappletCsp {
    fn default() -> Self {
        TappletCsp("default-src 'self'".to_string())
    }
}

impl FromStr for TappletCsp {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let trimmed = s.trim();
        if trimmed.is_empty() || trimmed == "null" {
            Ok(TappletCsp::default())
        } else {
            Ok(TappletCsp(trimmed.to_string()))
        }
    }
}

impl TappletCsp {
    pub fn to_header_value(&self) -> Result<HeaderValue, reqwest::header::InvalidHeaderValue> {
        HeaderValue::from_str(&self.0)
    }
}
