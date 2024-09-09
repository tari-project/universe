use fluent_uri::{component::Scheme, error::ParseError, UriRef};
use log::{debug, error, info};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use thiserror::Error;

#[derive(Debug)]
pub struct DeepLinkParser {}

const SCHEME: &Scheme = Scheme::new_or_panic("tari");
const AUTHORITY: &str = "com.tari.universe";

#[derive(Error, Debug)]
pub enum DeepLinkError {
    #[error("ParseError: {0}")]
    ParseError(#[from] ParseError),
    #[error("No scheme found")]
    NoScheme,

    #[error("Invalid scheme: {0}")]
    InvalidScheme(String),

    #[error("No authority found")]
    NoAuthority,

    #[error("Invalid authority: {0}")]
    InvalidAuthority(String),

    #[error("PortParseError: {0}")]
    PortParseError(#[from] std::num::ParseIntError),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeepLink {
    pub uri: String,
    pub scheme: String,
    pub authority_host: String,
    pub authority_port: Option<u16>,
    pub path: String,
    pub query: Option<String>,
    pub fragment: Option<String>,
}

impl DeepLinkParser {
    pub fn parse_uri(uri: &str) -> Result<DeepLink, DeepLinkError> {
        let uri_ref = UriRef::parse(uri)?;

        let scheme = uri_ref.scheme().ok_or(DeepLinkError::NoScheme)?;
        if scheme != SCHEME {
            Err(DeepLinkError::InvalidScheme(scheme.to_string()))?;
        }

        let authority = uri_ref.authority().ok_or(DeepLinkError::NoAuthority)?;
        if authority.host() != AUTHORITY {
            Err(DeepLinkError::InvalidAuthority(authority.to_string()))?;
        }

        let port = authority.port_to_u16()?;

        let path: String = uri_ref.path().to_string();
        let query = uri_ref.query().map(|q| q.to_string());
        let fragment = uri_ref.fragment().map(|f| f.to_string());
        Ok(DeepLink {
            authority_host: authority.host().to_string(),
            authority_port: port,
            scheme: scheme.to_string(),
            uri: uri.to_string(),
            path,
            query,
            fragment,
        })
    }

    pub fn handle(handle: AppHandle) -> Box<dyn FnMut(String) + Send + 'static> {
        let cloned_handle = handle.clone();
        Box::new(move |request: String| {
            debug!("deep link received {:?}", request);
            let result = DeepLinkParser::parse_uri(&request);
            let deep_link_parsed = match result {
                Err(e) => {
                    error!("Error parsing deeplink: {:?}", e);
                    return;
                }
                Ok(deep_link) => deep_link,
            };
            info!("Deep link parsed: {:?}", deep_link_parsed);

            let event_handled = cloned_handle.emit_all("tari-deeplink-received", deep_link_parsed);
            if let Err(e) = event_handled {
                error!("Error emitting deeplink event: {:?}", e);
            }
        })
    }
}

#[cfg(test)]
mod tests {
    use crate::deep_link::DeepLinkParser;

    #[test]
    fn test_deep_link_parser_full() {
        let uri = "tari://com.tari.universe/contacts?name=alice";
        let deep_link = DeepLinkParser::parse_uri(uri).unwrap();
        assert_eq!(deep_link.scheme, "tari");
        assert_eq!(deep_link.authority_host, "com.tari.universe");
        assert_eq!(deep_link.path, "/contacts");
        assert_eq!(deep_link.query, Some("name=alice".to_string()));
    }

    #[test]
    fn test_deep_link_parser_fails_schema() {
        let uri = "schema://com.tari.universe";
        let deep_link = DeepLinkParser::parse_uri(uri);
        assert!(deep_link.is_err());
    }

    #[test]
    fn test_deep_link_parser_fails_authority() {
        let uri = "tari://invalid.authority";
        let deep_link = DeepLinkParser::parse_uri(uri);
        assert!(deep_link.is_err());
    }

    #[test]
    fn test_deep_link_parser_optional_fields() -> anyhow::Result<()> {
        let uri = "tari://com.tari.universe";
        let deep_link = DeepLinkParser::parse_uri(uri)?;
        assert_eq!(deep_link.authority_port, None);
        assert_eq!(deep_link.query, None);
        assert_eq!(deep_link.fragment, None);
        Ok(())
    }
}
