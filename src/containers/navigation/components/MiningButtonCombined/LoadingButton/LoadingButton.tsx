import LoadingDots from '@app/components/elements/loaders/LoadingDots';
import { LoadingWrapper } from './styles';
import startBg from '../backgrounds/start.png';
import ecoBg from '../backgrounds/eco.png';
import ludicrousBg from '../backgrounds/ludicrous.png';
import customBg from '../backgrounds/custom.png';
import { useMemo } from 'react';
import { useConfigMiningStore } from '@app/store';

export default function LoadingButton() {
    const selectedMode = useConfigMiningStore((s) => s.mode);

    const backgroundImage = useMemo(() => {
        switch (selectedMode) {
            case 'Eco':
                return ecoBg;
            case 'Ludicrous':
                return ludicrousBg;
            case 'Custom':
                return customBg;
            default:
                return startBg;
        }
    }, [selectedMode]);

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
