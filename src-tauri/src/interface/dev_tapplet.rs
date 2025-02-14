#[derive(Debug, serde::Deserialize)]
pub struct DevTappletResponse {
    #[serde(rename = "packageName")]
    pub package_name: String,
    #[serde(rename = "displayName")]
    pub display_name: String,
    pub version: String, //TODO save ver in db
}
