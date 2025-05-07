export type SupportedChain = 'MAINNET' | 'STAGENET' | 'NEXTNET' | '';
export interface ActiveTapplet {
    tapplet_id: number;
    display_name: string;
    source: string;
    version: string;
    supportedChain: SupportedChain[];
}

export interface BuiltInTapplet {
    id: number;
    endpoint: string;
    package_name?: string;
    display_name?: string;
    about_summary?: string;
    about_description?: string;
}

export interface TappletConfig {
    packageName: string;
    version: string;
    permissions: object;
    supportedChain: SupportedChain[];
}
