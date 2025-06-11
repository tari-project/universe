export interface ExchangeContent {
    createdAt: string;
    updatedAt: string;
    id: string;
    exchange_id: string;
    name: string;
    campaign_cta?: string;
    campaign_title: string;
    campaign_description: string;
    campaign_tagline?: string;
    wallet_label: string;
    secondary_colour: string;
    primary_colour: string;
    logo_img_url: string;
    hero_img_url: string;
    logo_img_small_url?: string;
    reward_percentage: number;
    exchange_url?: string;
}

// Must match struct ExchangeMiner in app_in_memory_config.rs
export interface ExchangeMiner {
    id: string;
    name: string;
    slug: string;
}
type ExchangeBranding = Pick<
    ExchangeContent,
    'logo_img_small_url' | 'logo_img_url' | 'primary_colour' | 'secondary_colour' | 'hero_img_url' | 'exchange_url'
>;
export interface ExchangeMinerAssets extends ExchangeMiner, ExchangeBranding {
    logoImgUrl?: string; // are these needed?
    logoImgUrlSmall?: string; // are these needed?
}
