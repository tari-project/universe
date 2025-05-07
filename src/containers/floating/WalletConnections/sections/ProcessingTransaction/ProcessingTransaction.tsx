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
import { useEffect, useState } from 'react';
import { SuccessIcon } from '../../icons/elements/SuccessIcon';
import { useAccount } from 'wagmi';
import { truncateMiddle } from '@app/utils';
import { setWalletConnectModalOpen } from '@app/store/actions/walletStoreActions';

type Status = 'processing' | 'success' | 'error';

export const ProcessingTransaction = () => {
    const [status, setStatus] = useState<Status>('processing');

    const dataAcc = useAccount();

    useEffect(() => {
        setTimeout(() => {
            setStatus('success');
        }, 6000);
    }, []);

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
        <>
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
                onClick={() => setWalletConnectModalOpen(false)}
            >
                {status === 'processing' ? 'Processing transaction' : 'Done'}
                {status === 'processing' ? loadingDots : null}
            </WalletButton>
        </>
    );
};
