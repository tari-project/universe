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
import { useMemo } from 'react';

export type SwapStatus = 'processingapproval' | 'processingswap' | 'success' | 'error';

interface Props {
    status: SwapStatus;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    transactionId?: string;
}

export const ProcessingTransaction = ({ status, isOpen, setIsOpen, transactionId }: Props) => {
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
            key: 'Transaction id',
            value: transactionId || loadingDots,
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

    const ctaMessage = useMemo(() => {
        switch (status) {
            case 'processingapproval':
                return 'Awaiting Approval';
            case 'processingswap':
                return 'Processing Swap';
            case 'success':
                return 'Done';
            case 'error':
                return 'Close';
        }
    }, [status]);
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
                    disabled={status === 'processingswap' || status === 'processingapproval'}
                    onClick={() => setWalletUiVisible(false)}
                >
                    {ctaMessage}
                </WalletButton>
            </AnimatePresence>
        </TransactionModal>
    );
};
