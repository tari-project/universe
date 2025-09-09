import { TappletPermissions, TariPermissions } from '@tari-project/tari-permissions';

export type SupportedChain = 'MAINNET' | 'STAGENET' | 'NEXTNET' | '';

export interface WindowSize {
    width: number;
    height: number;
}

export interface TappletSignerParams {
    id: string;
    name?: string;
    onConnection?: () => void;
    permissions?: TappletPermissions;
}

export interface AccountData {
    account_id: number;
    address: string;
}

export interface SendOneSidedRequest {
    amount: string;
    address: string;
    paymentId?: string;
}

export interface BridgeTxDetails {
    amount: string;
    amountToReceive: string;
    destinationAddress: string;
    paymentId: string;
}

export interface RegisteredTapplet {
    id: number;
    tapp_registry_id: string;
    package_name: string;
    display_name: string;
    author_name: string;
    author_website: string;
    about_summary: string;
    about_description: string;
    category: string;
    csp: string;
    tapplet_permissions: string;
}
export interface Assets {
    icon_url: string;
    background_url: string;
}

export type RegisteredTappletWithAssets = RegisteredTapplet & Assets;

export interface InstalledTapplet {
    id: number;
    tapplet_id: number;
    tapplet_version_id: number;
}

export interface InstalledTappletWithName {
    installed_tapplet: InstalledTapplet;
    display_name: string;
    installed_version: string;
    latest_version: string;
}

export type InstalledTappletWithAssets = InstalledTappletWithName & Assets;

export interface DevTapplet {
    id: number;
    package_name: string;
    source: string;
    display_name: string;
    about_summary: string;
    about_description: string;
    csp: string;
    tapplet_permissions: string;
    isRunning: boolean;
}

export type DevTappletWithAssets = DevTapplet & {
    about_summary: string;
    about_description: string;
};

export interface TappletVersion {
    id: number;
    tapplet_id: number;
    version: string;
    integrity: string;
    registry_url: string;
    logo_url: string;
}

export interface RegisteredTappletWithVersion {
    id: number;
    registered_tapp: RegisteredTapplet;
    tapp_version: TappletVersion;
}

export interface TappletAudit {
    id: number;
    tapplet_id: number;
    auditor: string;
    report_url: string;
}

export interface TappletConfig {
    package_name: string;
    display_name: string;
    version: string;
    permissions: TariPermissions;
    supportedChain: SupportedChain[];
    csp: string;
    tapplet_permissions: string;
}

export type ActiveTapplet = TappletConfig & {
    tapplet_id: number;
    source: string;
};

export interface AllowedIframeMsgOrigins {
    allowSendTo: string[];
    allowReceiveFrom: string[];
}

export type RunningTapplet = ActiveTapplet & AllowedIframeMsgOrigins;
