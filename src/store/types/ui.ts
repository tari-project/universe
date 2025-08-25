import { SB_MINI_WIDTH, SB_SPACING } from '@app/theme/styles.ts';

export const sidebarTowerOffset = SB_SPACING + SB_MINI_WIDTH;
export const TOWER_CANVAS_ID = 'tower-canvas';
const _DIALOG_TYPES = [
    'logs',
    'restart',
    'autoUpdate',
    'releaseNotes',
    'ludicrousConfirmation',
    'warmup',
    'keychain',
    'xc_url',
    'createPin',
    'enterPin',
    'forgotPin',
    'failedModuleInitialization',
] as const;
type DialogTypeTuple = typeof _DIALOG_TYPES;
export type DialogType = DialogTypeTuple[number] | null;

export type AdminShow = 'setup' | 'main' | 'shutdown' | null;
export type CONNECTION_STATUS = 'connected' | 'disconnected' | 'disconnected-severe';
const _SIDEBAR_TYPES = ['mining', 'wallet'] as const;

type SidebarTypeTuple = typeof _SIDEBAR_TYPES;
export type SidebarType = SidebarTypeTuple[number];
