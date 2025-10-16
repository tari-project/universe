import { MiningModes, MiningModeType } from '@app/types/configs.ts';
import ecoIcon from '@app/assets/icons/emoji/eco.png';
import ludicIcon from '@app/assets/icons/emoji/ludicrous.png';
import turboIcon from '@app/assets/icons/emoji/tornado.png';
import customIcon from '@app/assets/icons/emoji/custom.png';

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
