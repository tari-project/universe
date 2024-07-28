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

    pub async fn summary(&self) -> Result<models::Summary, reqwest::Error> {
        let response = self.get("1/summary").await?;
        response.json().await
    }
}
