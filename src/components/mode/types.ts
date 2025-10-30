import { MiningModeType } from '@app/types/configs.ts';

export type Variant = 'primary' | 'secondary';

export interface ModeDropdownMiningMode {
    sortingIndex?: string;
    name: string;
    mode_type: MiningModeType;
    icon: string;
}

export interface ModeColourGroup {
    base: string;
    accent: string;
    light: string;
    dark: string;
    shadow: string;
}
