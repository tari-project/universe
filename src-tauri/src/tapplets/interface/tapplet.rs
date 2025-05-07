#[derive(Debug, Clone, serde::Serialize)]
pub struct Tapplet {
    pub id: Option<i32>,
    pub registry_id: String,
    pub package_name: String,
    pub display_name: String,
    pub logo_url: String,
    pub background_url: String,
    pub author_name: String,
    pub author_website: String,
    pub about_summary: String,
    pub about_description: String,
    pub category: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct TappletVersion {
    pub id: Option<i32>,
    pub tapplet_id: Option<i32>,
    pub version: String,
    pub integrity: String,
    pub registry_url: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct ActiveTapplet {
    pub tapplet_id: i32,
    pub display_name: String,
    pub source: String,
    pub version: String,
}
