export interface ExchangeContent {
    createdAt?: string;
    updatedAt?: string;
    id: string;
    slug: string;
    exchange_id: string;
    name: string;
    campaign_cta?: string;
    campaign_title?: string;
    campaign_description?: string;
    campaign_tagline?: string;
    wallet_label?: string;
    secondary_colour?: string;
    primary_colour?: string;
    logo_img_url?: string;
    hero_img_url?: string;
    logo_img_small_url?: string;
    reward_expiry_date?: string;
    reward_percentage?: number;
    is_hidden: boolean;
    exchange_url?: string;
}

// Must match struct ExchangeMiner in app_in_memory_config.rs
export interface ExchangeMiner {
    id: string;
    name: string;
    slug: string;
}
// TODO - consolidate these types properly
type ExchangeBranding = Pick<
    ExchangeContent,
    | 'logo_img_small_url'
    | 'logo_img_url'
    | 'primary_colour'
    | 'secondary_colour'
    | 'hero_img_url'
    | 'exchange_url'
    | 'campaign_description'
    | 'campaign_title'
    | 'reward_expiry_date'
    | 'slug'
    | 'is_hidden'
    | 'campaign_cta'
    | 'exchange_id'
>;
export interface ExchangeMinerAssets extends ExchangeMiner, ExchangeBranding {
    logoImgUrl?: string; // are these needed?
    logoImgUrlSmall?: string; // are these needed?
}
