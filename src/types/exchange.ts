// Must match struct ExchangeMiner in app_in_memory_config.rs
export interface ExchangeMiner {
    id: string;
    name: string;
    slug: string;
}

export interface ExchangeData extends ExchangeMiner {
    createdAt?: string | null;
    updatedAt?: string | null;

    exchange_url?: string | null;
    is_hidden: boolean;
    wallet_label?: string | null;

    download_link_mac?: string | null;
    download_link_win?: string | null;
    download_link_linux?: string | null;

    wxtm_mode: boolean; // When true, the exchange is in WXT mode, which means that the user will be able to enter ETH address to receive WXT tokens on exchange
}

export interface ExchangeBranding extends ExchangeData {
    exchange_id: string; // used with internal app config state

    address_help_link?: string;

    campaign_cta?: string;
    campaign_title?: string;
    campaign_tagline?: string;
    campaign_description?: string;

    dark_logo_img_url?: string;
    dark_logo_img_small_url?: string;

    hero_img?: string;
    hero_img_url?: string;

    logo_img_url?: string;
    logo_img_small_url?: string;

    primary_colour?: string;
    secondary_colour?: string;

    reward_percentage?: number;
    reward_expiry_date?: string;
    reward_image?: string;

    wallet_app_label?: string;
    wallet_app_link?: string;
}
