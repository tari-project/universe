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

interface Props {
    $isScrolled: boolean;
}

export default function SecureWalletWarning({ $isScrolled }: Props) {
    const { setModal } = useSecurityStore();

    const [seedBackedUp, setSeedBackedUp] = useState(false);
    const [pinLocked, setPinLocked] = useState(false);

    const handleClick = () => {
        setModal('intro');
    };

    useEffect(() => {
        const checkFlags = async () => {
            const backed_up = await invoke('is_seed_backed_up');
            setSeedBackedUp(backed_up);
            const locked = await invoke('is_pin_locked');
            setPinLocked(locked);
        };
        checkFlags();
    }, []);

    if (seedBackedUp && pinLocked) {
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
                            <SecureIcon aria-hidden="true">❗</SecureIcon> {`Secure your wallet`}
                        </LeftTextGroup>
                        <StepsWrapper>
                            <StepsText>{`Steps`}</StepsText>
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
