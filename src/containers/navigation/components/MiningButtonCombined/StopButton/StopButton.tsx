import { IconWrapper } from '../StartButton/styles';
import StopIcon from './icons/StopIcon';
import { DropdownWrapper, HitBox, StopWrapper, Text } from './styles';
import ModeDropdown from './components/ModeDropdown/ModeDropdown';
import AnimatedBackground from './components/AnimatedBackground/AnimatedBackground';
import { useTranslation } from 'react-i18next';
import { useConfigMiningStore } from '@app/store';

interface Props {
    onClick: () => void;
}

export default function StopButton({ onClick }: Props) {
    const { t } = useTranslation('mining-view');
    const selectedMode = useConfigMiningStore((s) => s.mode);

    return (
        <StopWrapper
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            $selectedMode={selectedMode}
        >
            <HitBox onClick={onClick}>
                <IconWrapper $absolute={false} className="stop-icon">
                    <StopIcon />
                </IconWrapper>
                <Text className="stop-text">{t(`mining-button-text.stop-mining`)}</Text>
            </HitBox>
            <DropdownWrapper>
                <ModeDropdown />
            </DropdownWrapper>
            <AnimatedBackground />
        </StopWrapper>
    );
}
