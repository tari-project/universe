import { HeaderWrapper, StatusWrapper } from './SignApprovalMessage.styles';
import Metamask from '../../icons/mm-fox';
import TransactionModal from '@app/components/TransactionModal/TransactionModal';
import { useTranslation } from 'react-i18next';
import LoadingDots from '@app/components/elements/loaders/LoadingDots';

interface Props {
    isOpen: boolean;
    setIsOpen?: (isOpen: boolean) => void;
}
export const SignApprovalMessage = ({ isOpen, setIsOpen }: Props) => {
    const { t } = useTranslation(['wallet'], { useSuspense: false });
    return (
        // Prevent close on click outside just for this modal
        <TransactionModal show={isOpen} handleClose={() => setIsOpen?.(false)} noClose>
            <HeaderWrapper>
                <Metamask width="65" />
                <h3>{t('swap.sign-message')}</h3>
                <p>{t('swap.sign-message-text')}</p>
            </HeaderWrapper>
            <StatusWrapper>
                <Metamask width="24" />
                {t('swap.waiting-for-response')}
                <LoadingDots />
            </StatusWrapper>
        </TransactionModal>
    );
};
