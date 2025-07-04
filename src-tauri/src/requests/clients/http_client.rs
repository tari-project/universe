use anyhow::anyhow;

use crate::requests::utils::create_user_agent;

pub struct HttpClient {
    client: reqwest_middleware::ClientWithMiddleware,
}

impl HttpClient {
    pub fn default() -> Self {
        let inner_client = reqwest::ClientBuilder::new()
            .user_agent(create_user_agent())
            .build()
            .expect("Failed to create reqwest client");
        let client = reqwest_middleware::ClientBuilder::new(inner_client).build();

        HttpClient { client }
    }

    pub fn with_retries(retries: u32) -> Self {
        let retry_policy =
            reqwest_retry::policies::ExponentialBackoff::builder().build_with_max_retries(retries);

        let inner_client = reqwest::ClientBuilder::new()
            .user_agent(create_user_agent())
            .build()
            .expect("Failed to create reqwest client");

        let client = reqwest_middleware::ClientBuilder::new(inner_client)
            .with(reqwest_retry::RetryTransientMiddleware::new_with_policy(
                retry_policy,
            ))
            .build();

        HttpClient { client }
    }

    pub async fn send_head_request(&self, url: &str) -> Result<reqwest::Response, anyhow::Error> {
        let head_response = self.client.head(url).send().await;

        if let Ok(response) = head_response {
            if response.status().is_success() {
                return Ok(response);
            } else {
                return Err(anyhow!(
                    "HEAD request failed with status code: {}",
                    response.status()
                ));
            }
        };
        head_response.map_err(|e| anyhow!("HEAD request failed with error: {}", e))
    }

    #[allow(dead_code)]
    pub async fn send_get_request(&self, url: &str) -> Result<reqwest::Response, anyhow::Error> {
        let get_response = self.client.get(url).send().await;

        if let Ok(response) = get_response {
            if response.status().is_success() {
                return Ok(response);
            } else {
                return Err(anyhow!(
                    "GET request failed with status code: {}",
                    response.status()
                ));
            }
        };

        get_response.map_err(|e| anyhow!("GET request failed with error: {}", e))
    }
}
