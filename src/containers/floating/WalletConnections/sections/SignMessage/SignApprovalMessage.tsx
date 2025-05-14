import { HeaderWrapper, StatusWrapper, LoadingDots } from './SignApprovalMessage.styles';
import Metamask from '../../icons/mm-fox';
import TransactionModal from '@app/components/TransactionModal/TransactionModal';
import { AnimatePresence } from 'motion/react';

interface Props {
    isOpen: boolean;
    setIsOpen?: (isOpen: boolean) => void;
}
export const SignApprovalMessage = ({ isOpen, setIsOpen }: Props) => {
    return (
        <TransactionModal show={isOpen} handleClose={() => setIsOpen?.(false)}>
            <AnimatePresence mode="wait">
                <HeaderWrapper>
                    <Metamask width="65" />
                    <h3>{'Sign the message on your mobile device'}</h3>
                    <p>
                        {
                            'Approve this transaction using Metamask on your mobile device. Once it has been signed, your transaction will be processed.'
                        }
                    </p>
                </HeaderWrapper>
                <StatusWrapper>
                    <Metamask width="24" />
                    <span>
                        {'Waiting for response'}
                        <LoadingDots />
                    </span>
                </StatusWrapper>
            </AnimatePresence>
        </TransactionModal>
    );
};
