use anyhow::anyhow;
use reqwest::Client;
use serde::Deserialize;

#[derive(Deserialize)]
struct Release {
    tag_name: String,
    assets: Vec<Asset>,
}

#[derive(Deserialize)]
struct Asset {
    name: String,
    browser_download_url: String,
}

pub async fn get_latest_release(repo_owner: &str, repo_name: &str, tag: &str) -> Result<String, anyhow::Error> {
    let client = Client::new();
    let url = format!(
        "https://api.github.com/repos/{}/{}/releases/tags/{}",
        repo_owner, repo_name, tag
    );
    todo!("get_latest_release not implemented")

}

pub async fn list_releases(
    repo_owner: &str,
    repo_name: &str,
) -> Result<Vec<semver::Version>, anyhow::Error> {

    let client = Client::new();
    let url = format!(
        "https://api.github.com/repos/{}/{}/releases",
        repo_owner, repo_name
    );

    let response = client
        .get(&url)
        .header("User-Agent", "request")
        .send()
        .await?;
    if response.status() != 200 {
        return Err(anyhow!("Failed to fetch releases: {}", response.status()));
    }
    let data = response.text().await ?;
    let releases: Vec<Release> = serde_json::from_str(&data)?;

    println!("Releases for {}/{}:", repo_owner, repo_name);
    let mut res = vec! [];
    for release in releases {
        println!("- {}", release.tag_name);
        res.push(semver::Version::parse(&release.tag_name)?);
    }

    Ok(res)
}