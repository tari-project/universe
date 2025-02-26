import { TariPermission } from '@tari-project/tari-permissions';

export interface RegisteredTapplet {
    id: string;
    registry_id: string;
    package_name: string;
    display_name: string;
    author_name: string;
    author_website: string;
    about_summary: string;
    about_description: string;
    category: string;
}

export type RegisteredTappletWithAssets = RegisteredTapplet & {
    logoAddr: string;
    backgroundAddr: string;
};

export interface InstalledTapplet {
    id: number;
    tapplet_id: number; //TODO change to number because of rust i32
    tapplet_version_id: string;
}

export interface InstalledTappletWithAssets {
    installed_tapplet: InstalledTapplet;
    display_name: string;
    installed_version: string;
    latest_version: string;
    logoAddr: string;
    backgroundAddr: string;
}

export interface DevTapplet {
    id: number;
    package_name: string;
    endpoint: string;
    display_name: string;
    about_summary: string;
    about_description: string;
}

export type DevTappletWithAssets = DevTapplet & {
    about_summary: string;
    about_description: string;
};

export interface TappletVersion {
    id: string;
    tapplet_id: string;
    version: string;
    integrity: string;
    registry_url: string;
    logo_url: string;
}

export interface RegisteredTappletWithVersion {
    id: string;
    registered_tapp: RegisteredTapplet;
    tapp_version: TappletVersion;
}

export interface TappletAudit {
    id: string;
    tapplet_id: string;
    auditor: string;
    report_url: string;
}

export interface ActiveTapplet {
    tapplet_id: number;
    display_name: string;
    source: string;
    version: string;
    permissions?: TappletPermissions;
    supportedChain: SupportedChain[];
}

export type SupportedChain = 'MAINNET' | 'STAGENET' | 'NEXTNET' | '';
export interface TappletConfig {
    packageName: string;
    version: string;
    permissions: TappletPermissions;
    supportedChain: SupportedChain[];
}

// TODO impor it from tari.js when is possible
export interface TappletPermissions {
    requiredPermissions: TariPermission[];
    optionalPermissions: TariPermission[];
}
