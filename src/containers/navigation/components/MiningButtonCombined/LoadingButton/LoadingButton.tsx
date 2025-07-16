import LoadingDots from '@app/components/elements/loaders/LoadingDots';
import { LoadingWrapper } from './styles';
import startBg from '../backgrounds/start.png';
import ecoBg from '../backgrounds/eco.png';
import ludicrousBg from '../backgrounds/ludicrous.png';
import customBg from '../backgrounds/custom.png';
import { useMemo } from 'react';
import { MiningModeType } from '@app/types/configs';
import { useConfigMiningStore } from '@app/store';

export default function LoadingButton() {
    const selectedMiningMode = useConfigMiningStore((state) => state.getSelectedMiningMode());

    const backgroundImage = useMemo(() => {
        switch (selectedMiningMode?.mode_type) {
            case MiningModeType.Eco:
                return ecoBg;
            case MiningModeType.Ludicrous:
                return ludicrousBg;
            case MiningModeType.Custom:
                return customBg;
            case MiningModeType.User:
                return customBg;
            default:
                return startBg;
        }
    }, [selectedMiningMode]);

    return (
        <LoadingWrapper
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            $backgroundImage={backgroundImage}
        >
            <LoadingDots />
        </LoadingWrapper>
    );
}
