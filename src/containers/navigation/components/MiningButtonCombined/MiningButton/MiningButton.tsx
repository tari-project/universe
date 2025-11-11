import { ReactNode, useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useConfigMiningStore } from '@app/store';
import TimerChip from './components/pause/TimerChip.tsx';
import AnimatedBackground from './components/AnimatedBackground/AnimatedBackground';
import { DropdownWrapper, HitBox, ButtonWrapper, Text, IconWrapper, Shadow, TextWrapper } from './styles';

interface Props {
    onClick: () => void;
    disabled?: boolean;
    buttonText: string;
    icon: ReactNode;
    isMining: boolean;
    resumeTime?: { displayString?: string; fullTimeString?: string };
    children: ReactNode;
}

export default function MiningButton({
    children,
    onClick,
    buttonText,
    icon,
    isMining,
    disabled = false,
    resumeTime,
}: Props) {
    const [showBg, setShowBg] = useState(false);
    const { t } = useTranslation('mining-view');
    const selectedMiningModeName = useConfigMiningStore((s) => s.selected_mining_mode);
    const selectedMiningMode = useConfigMiningStore((s) => s.mining_modes[selectedMiningModeName]);
    const hasChip = !!resumeTime?.displayString;

    useEffect(() => {
        setShowBg(isMining);
    }, [isMining]);

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
                        {t(`mining-button-text.state`, { context: buttonText })}
                    </Text>
                    {hasChip && <TimerChip resumeTime={resumeTime} />}
                </TextWrapper>
            </HitBox>
            <DropdownWrapper>{children}</DropdownWrapper>
            <AnimatePresence>
                {!isMining && <Shadow initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
            </AnimatePresence>
            <AnimatePresence>{showBg ? <AnimatedBackground /> : null}</AnimatePresence>
        </ButtonWrapper>
    );
}
