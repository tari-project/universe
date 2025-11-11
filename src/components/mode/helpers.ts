import { MiningModes, MiningModeType } from '@app/types/configs.ts';
import ecoIcon from '@app/assets/icons/emoji/eco.png';
import ludicIcon from '@app/assets/icons/emoji/ludicrous.png';
import turboIcon from '@app/assets/icons/emoji/tornado.png';
import customIcon from '@app/assets/icons/emoji/custom.png';
import { ModeColourGroup } from '@app/components/mode/types.ts';

const getModeIcon = (mode: MiningModeType) => {
    switch (mode) {
        case MiningModeType.Eco:
            return ecoIcon;
        case MiningModeType.Turbo:
            return turboIcon;
        case MiningModeType.Ludicrous:
            return ludicIcon;
        case MiningModeType.Custom:
            return customIcon;
        case MiningModeType.User:
            return customIcon;
        default:
            return customIcon;
    }
};

const getSortingIndex = (mode: MiningModeType) => {
    switch (mode) {
        case MiningModeType.Eco:
            return 'a';
        case MiningModeType.Turbo:
            return 'b';
        case MiningModeType.Ludicrous:
            return 'c';
        case MiningModeType.Custom:
            return 'd';
        case MiningModeType.User:
            return 'e';
        default:
            return 'f';
    }
};

export const getModeList = (modes: MiningModes) =>
    Object.values(modes)
        .map((mode) => {
            return {
                sortingIndex: getSortingIndex(mode.mode_type),
                name: mode.mode_name,
                mode_type: mode.mode_type,
                icon: getModeIcon(mode.mode_type),
            };
        })
        .sort((a, b) => a.sortingIndex.localeCompare(b.sortingIndex));

export const getModeColours = (mode?: MiningModeType): ModeColourGroup => {
    switch (mode) {
        case MiningModeType.Custom:
        case MiningModeType.User:
            return {
                base: '#123959',
                accent: '#8AC2EFC9',
                light: '#397fb9',
                shadow: 'rgba(57,127,185,0.15)',
                dark: '#123959',
            };
        case MiningModeType.Ludicrous:
            return {
                base: '#77341f',
                accent: '#F3B16EA8',
                light: '#ff6100',
                shadow: 'rgba(255,97,0,0.12)',
                dark: '#5b1b07',
            };

        case MiningModeType.Turbo:
            return {
                base: '#154349',
                accent: '#9DFFB168',
                light: '#4a7a60',
                shadow: 'rgba(74,122,96,0.15)',
                dark: '#07353a',
            };
        case MiningModeType.Eco:
        default:
            return {
                base: '#4e7a4a',
                accent: '#FFEBAB8C',
                light: '#A5B938E2',
                shadow: 'rgba(165,185,56,0.15)',
                dark: '#203d1d',
            };
    }
};
