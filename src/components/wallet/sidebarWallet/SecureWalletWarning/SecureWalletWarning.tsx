import { useSecurityStore } from '@app/store';
import {
    LeftTextGroup,
    SecureIcon,
    SecureWalletWarningButton,
    StepsDot,
    StepsDots,
    StepsText,
    StepsWrapper,
    Wrapper,
} from './styles';
import { AnimatePresence } from 'motion/react';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
    $isScrolled: boolean;
    $isHidden: boolean;
}

export default function SecureWalletWarning({ $isScrolled, $isHidden }: Props) {
    const setModal = useSecurityStore((s) => s.setModal);
    const { t } = useTranslation('staged-security');

    const [seedBackedUp, setSeedBackedUp] = useState(false);
    const [pinLocked, setPinLocked] = useState(false);

    const handleClick = () => {
        setModal('intro');
    };

    useEffect(() => {
        invoke('is_pin_locked').then((locked) => setPinLocked(locked));
    }, []);

    useEffect(() => {
        invoke('is_seed_backed_up').then((backed_up) => setSeedBackedUp(backed_up));
    }, []);

    if ((seedBackedUp && pinLocked) || $isHidden) {
        return null;
    }

    return (
        <AnimatePresence>
            {!$isScrolled && (
                <Wrapper
                    initial={{ opacity: 0, height: 'auto' }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                >
                    <SecureWalletWarningButton onClick={handleClick}>
                        <LeftTextGroup>
                            <SecureIcon aria-hidden="true">❗</SecureIcon> {t('warning.title')}
                        </LeftTextGroup>
                        <StepsWrapper>
                            <StepsText>{t('warning.steps')}</StepsText>
                            <StepsDots>
                                <StepsDot $isActive={seedBackedUp} />
                                <StepsDot $isActive={pinLocked} />
                            </StepsDots>
                        </StepsWrapper>
                    </SecureWalletWarningButton>
                </Wrapper>
            )}
        </AnimatePresence>
    );
}
