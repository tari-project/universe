import { MiningModes, MiningModeType } from '@app/types/configs.ts';
import ecoIcon from './images/eco.png';
import ludicIcon from './images/ludicrous.png';
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

export const getModeList = (modes: MiningModes) =>
    Object.values(modes).map((mode) => {
        return {
            name: mode.mode_name,
            mode_type: mode.mode_type,
            icon: getModeIcon(mode.mode_type),
        };
    });
