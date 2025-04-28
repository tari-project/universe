import { ProcessingDetailsWrapper, StatusValue } from './ProcessingTransaction.styles';
import { WalletButton } from '../../components/WalletButton/WalletButton';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { truncateMiddle } from '@app/utils';
import { setWalletConnectModalOpen } from '@app/store/actions/walletStoreActions';
import { StatusHero } from '@app/components/transactions/components/StatusHero/StatusHero';
import CompletedIcon from '@app/components/transactions/send/SendReview/icons/CompletedIcon';
import ProcessingIcon from '@app/components/transactions/send/SendReview/icons/ProcessingIcon';
import { StatusList, StatusListEntry } from '@app/components/transactions/components/StatusList/StatusList';
import LoadingDots from '@app/components/transactions/send/SendReview/icons/LoadingDots';

type Status = 'processing' | 'success' | 'error';

export const ProcessingTransaction = () => {
    const [status, setStatus] = useState<Status>('processing');

    const dataAcc = useAccount();

    useEffect(() => {
        setTimeout(() => {
            setStatus('success');
        }, 6000);
    }, []);

    const statusItems: StatusListEntry[] = [
        {
            label: 'Status',
            value: <StatusValue $status={status}>{status === 'success' ? 'Completed' : 'Processing'}</StatusValue>,
        },
        {
            label: 'Total Fees',
            value: '0.03%',
        },
        {
            label: 'Swap id',
            value: status === 'success' ? truncateMiddle(dataAcc.address || '', 5) : <LoadingDots />,
        },
        {
            label: 'Ethereum Txn',
            value: status === 'success' ? truncateMiddle(dataAcc.address || '', 5) : <LoadingDots />,
        },
        {
            label: 'Tari Txn',
            value: status === 'success' ? truncateMiddle(dataAcc.address || '', 5) : <LoadingDots />,
        },
    ];

    return (
        <>
            <StatusHero
                icon={status === 'success' ? <CompletedIcon /> : <ProcessingIcon />}
                title={'Your XTM is on the way!'}
            >
                {'Your purchase is processing. This can take a few minutes.'}
            </StatusHero>

            <ProcessingDetailsWrapper>
                <StatusList entries={statusItems} />
            </ProcessingDetailsWrapper>

            <WalletButton
                variant="primary"
                size="xl"
                disabled={status === 'processing'}
                onClick={() => setWalletConnectModalOpen(false)}
            >
                {status === 'processing' ? 'Processing transaction' : 'Done'}
                {status === 'processing' ? <LoadingDots /> : null}
            </WalletButton>
        </>
    );
};
