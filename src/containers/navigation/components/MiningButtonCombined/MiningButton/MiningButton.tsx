import { DropdownWrapper, HitBox, ButtonWrapper, Text, IconWrapper, Shadow } from './styles';
import ModeDropdown from './components/ModeDropdown/ModeDropdown';
import AnimatedBackground from './components/AnimatedBackground/AnimatedBackground';
import { useTranslation } from 'react-i18next';
import { useConfigMiningStore } from '@app/store';
import { AnimatePresence } from 'motion/react';

interface Props {
    onClick: () => void;
    disabled?: boolean;
    buttonText: string;
    icon: React.ReactNode;
    isMining: boolean;
}

export default function MiningButton({ onClick, buttonText, icon, isMining, disabled = false }: Props) {
    const { t } = useTranslation('mining-view');
    const selectedMode = useConfigMiningStore((s) => s.mode);

    return (
        <ButtonWrapper
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            $selectedMode={selectedMode}
            $disabled={disabled}
        >
            <HitBox onClick={onClick} disabled={disabled}>
                <IconWrapper $absolute={false} className="mining_button-icon">
                    {icon}
                </IconWrapper>
                <Text className="mining_button-text">{t(`mining-button-text.${buttonText}`)}</Text>
            </HitBox>
            <DropdownWrapper>
                <ModeDropdown />
            </DropdownWrapper>
            <AnimatePresence>
                {!isMining && <Shadow initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
            </AnimatePresence>
            <AnimatePresence>{isMining && <AnimatedBackground />}</AnimatePresence>
        </ButtonWrapper>
    );
}
