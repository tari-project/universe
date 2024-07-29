mod models;

pub struct XmrigHttpApiClient {
    url: String,
    access_token: String,
}

impl XmrigHttpApiClient {
    pub fn new(url: String, access_token: String) -> Self {
        Self { url, access_token }
    }

    async fn get(&self, path: &str) -> Result<reqwest::Response, reqwest::Error> {
        let url = format!("{}/{}", self.url, path);
        reqwest::Client::new()
            .get(&url)
            .header("Authorization", format!("Bearer {}", self.access_token))
            .send()
            .await
    }

    pub async fn summary(&self) -> Result<models::Summary, anyhow::Error> {
        for i in 0..3 {
            let response = self.get("2/summary").await?;

            let summary = response.text().await?;
            let summary: models::Summary = match serde_json::from_str(&summary) {
                Ok(summary) => summary,
                Err(e) => {
                    dbg!(summary);
                    eprintln!("Failed to parse xmrig summary: {}", e);
                    // Xmrig has a bug where it doesn't return valid json sometimes.
                    // https://github.com/xmrig/xmrig/issues/3363
                    continue;
                }
            };

            return Ok(summary);
        }
        return Err(anyhow::anyhow!("Failed to get xmrig summary"));
    }
}
