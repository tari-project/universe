import { ReactNode } from 'react';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useConfigMiningStore } from '@app/store';
import ModeDropdown from './components/ModeDropdown/ModeDropdown';
import AnimatedBackground from './components/AnimatedBackground/AnimatedBackground';
import { DropdownWrapper, HitBox, ButtonWrapper, Text, IconWrapper, Shadow, TextWrapper } from './styles';
import TimerChip from '@app/containers/navigation/components/MiningButtonCombined/MiningButton/components/pause/TimerChip.tsx';

interface Props {
    onClick: () => void;
    disabled?: boolean;
    buttonText: string;
    icon: ReactNode;
    isMining: boolean;
    resumeTime?: string;
}

export default function MiningButton({ onClick, buttonText, icon, isMining, disabled = false, resumeTime }: Props) {
    const { t } = useTranslation('mining-view');
    const selectedMiningMode = useConfigMiningStore((s) => s.getSelectedMiningMode());

    const hasChip = !!resumeTime;

    return (
        <ButtonWrapper
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            $selectedMode={selectedMiningMode?.mode_type || 'Eco'}
            $disabled={disabled}
        >
            <HitBox onClick={onClick} disabled={disabled}>
                <IconWrapper $absolute={false} className="mining_button-icon">
                    {icon}
                </IconWrapper>
                <TextWrapper>
                    <Text className="mining_button-text" animate={{ scale: hasChip ? 0.9 : 1, x: hasChip ? -4 : 0 }}>
                        {t(`mining-button-text.${buttonText}`)}
                    </Text>
                    {hasChip && <TimerChip resumeTime={resumeTime} />}
                </TextWrapper>
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
