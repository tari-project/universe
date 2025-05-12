import {
    HeaderWrapper,
    LoadingDots,
    ProcessingDetailsWrapper,
    ProcessingItemDetailKey,
    ProcessingItemDetailValue,
    ProcessingItemDetailWrapper,
    StatusValue,
} from './ProcessingTransaction.styles';
import { LoadingClock } from '../../icons/elements/LoadingClock';
import { WalletButton } from '../../components/WalletButton/WalletButton';
import { SuccessIcon } from '../../icons/elements/SuccessIcon';
import { useAccount } from 'wagmi';
import { truncateMiddle } from '@app/utils';
import { setWalletUiVisible } from '@app/store/actions/walletStoreActions';
import TransactionModal from '@app/components/TransactionModal/TransactionModal';
import { AnimatePresence } from 'motion/react';

type Status = 'processing' | 'success' | 'error';
interface Props {
    status: Status;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export const ProcessingTransaction = ({ status, isOpen, setIsOpen }: Props) => {
    const dataAcc = useAccount();

    const loadingDots = (
        <LoadingDots>
            <span>.</span>
            <span>.</span>
            <span>.</span>
        </LoadingDots>
    );
    const statusItems = [
        {
            key: 'Status',
            value: <StatusValue $status={status}> {status === 'success' ? 'Completed' : 'Processing'} </StatusValue>,
        },
        {
            key: 'Total Fees',
            value: '0.03%',
        },
        {
            key: 'Swap id',
            value: status === 'success' ? truncateMiddle(dataAcc.address || '', 5) : loadingDots,
        },
        {
            key: 'Ethereum Txn',
            value: status === 'success' ? truncateMiddle(dataAcc.address || '', 5) : loadingDots,
        },
        {
            key: 'Tari Txn',
            value: status === 'success' ? truncateMiddle(dataAcc.address || '', 5) : loadingDots,
        },
    ];
    return (
        <TransactionModal show={isOpen} handleClose={() => setIsOpen(false)}>
            <AnimatePresence mode="wait">
                <HeaderWrapper>
                    {status === 'success' ? <SuccessIcon width="65" /> : <LoadingClock width="65" />}
                    <h3>{'Your XTM is on the way!'}</h3>
                    <p>{'Your purchase is processing. This can take a few minutes.'}</p>
                </HeaderWrapper>

                <ProcessingDetailsWrapper>
                    {statusItems.map((item, index) => (
                        <ProcessingItemDetailWrapper key={`${item.key}-${index}`}>
                            <ProcessingItemDetailKey>{item.key}</ProcessingItemDetailKey>
                            <ProcessingItemDetailValue>{item.value}</ProcessingItemDetailValue>
                        </ProcessingItemDetailWrapper>
                    ))}
                </ProcessingDetailsWrapper>

                <WalletButton
                    variant="primary"
                    size="xl"
                    disabled={status === 'processing'}
                    onClick={() => setWalletUiVisible(false)}
                >
                    {status === 'processing' ? 'Processing transaction' : 'Done'}
                    {status === 'processing' ? loadingDots : null}
                </WalletButton>
            </AnimatePresence>
        </TransactionModal>
    );
};
