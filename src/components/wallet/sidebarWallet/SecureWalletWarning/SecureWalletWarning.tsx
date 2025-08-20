import { useSecurityStore, useWalletStore } from '@app/store';
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
import { useTranslation } from 'react-i18next';
import { useSetupStore } from '@app/store/useSetupStore';
import { setupStoreSelectors } from '@app/store/selectors/setupStoreSelectors';

interface Props {
    $isScrolled: boolean;
    isExchangeMiner: boolean;
}

export default function SecureWalletWarning({ $isScrolled, isExchangeMiner }: Props) {
    const { t } = useTranslation('staged-security');
    const setModal = useSecurityStore((s) => s.setModal);
    const pinLocked = useWalletStore((s) => s.is_pin_locked);
    const seedBackedUp = useWalletStore((s) => s.is_seed_backed_up);
    const walletModuleInitialized = useSetupStore(setupStoreSelectors.isWalletModuleInitialized);

    if (!walletModuleInitialized) {
        // Don't show anything until the wallet module is initialized
        return null;
    }

    const handleClick = () => {
        setModal(isExchangeMiner ? 'create_pin' : 'intro');
    };

    const isHidden = isExchangeMiner ? pinLocked : seedBackedUp && pinLocked;

    return !isHidden ? (
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
                        {!isExchangeMiner && (
                            <StepsWrapper>
                                <StepsText>{t('warning.steps')}</StepsText>
                                <StepsDots>
                                    <StepsDot $isActive={seedBackedUp} />
                                    <StepsDot $isActive={pinLocked} />
                                </StepsDots>
                            </StepsWrapper>
                        )}
                    </SecureWalletWarningButton>
                </Wrapper>
            )}
        </AnimatePresence>
    ) : null;
}
