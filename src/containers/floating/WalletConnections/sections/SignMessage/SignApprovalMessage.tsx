import { HeaderWrapper, StatusWrapper, LoadingDots } from './SignApprovalMessage.styles';
import Metamask from '../../icons/mm-fox';
import TransactionModal from '@app/components/TransactionModal/TransactionModal';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface Props {
    isOpen: boolean;
    setIsOpen?: (isOpen: boolean) => void;
}
export const SignApprovalMessage = ({ isOpen, setIsOpen }: Props) => {
    const { t } = useTranslation(['wallet'], { useSuspense: false });
    return (
        <TransactionModal show={isOpen} handleClose={() => setIsOpen?.(false)}>
            <AnimatePresence mode="wait">
                <HeaderWrapper>
                    <Metamask width="65" />
                    <h3>{t('swap.sign-message')}</h3>
                    <p>{t('swap.sign-message-text')}</p>
                </HeaderWrapper>
                <StatusWrapper>
                    <Metamask width="24" />
                    <span>
                        {t('swap.waiting-for-response')}
                        <LoadingDots />
                    </span>
                </StatusWrapper>
            </AnimatePresence>
        </TransactionModal>
    );
};
