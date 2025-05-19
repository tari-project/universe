import { ProcessingDetailsWrapper, StatusValue } from './ProcessingTransaction.styles';
import { WalletButton } from '../../components/WalletButton/WalletButton';
import { useAccount } from 'wagmi';
import { truncateMiddle } from '@app/utils';
import TransactionModal from '@app/components/TransactionModal/TransactionModal';
import { AnimatePresence } from 'motion/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StatusList, StatusListEntry } from '@app/components/transactions/components/StatusList/StatusList';
import { StatusHero } from '@app/components/transactions/components/StatusHero/StatusHero';
import ProcessingIcon from '@app/components/transactions/send/SendReview/icons/ProcessingIcon';
import LoadingDots from '@app/components/transactions/send/SendReview/icons/LoadingDots';
import CompletedIcon from '@app/components/transactions/send/SendReview/icons/CompletedIcon';

export type SwapStatus = 'processingapproval' | 'processingswap' | 'success' | 'error';

interface Props {
    status: SwapStatus;
    isOpen: boolean;
    fees?: string | null;
    setIsOpen: (isOpen: boolean) => void;
    transactionId?: string;
}

export const ProcessingTransaction = ({ status, isOpen, setIsOpen, transactionId, fees }: Props) => {
    const dataAcc = useAccount();
    const { t } = useTranslation(['wallet'], { useSuspense: false });

    const statusItems: StatusListEntry[] = [
        {
            label: t('swap.status'),
            value: (
                <StatusValue $status={status}>
                    {status === 'success' ? t('swap.completed') : t('swap.processing')}
                </StatusValue>
            ),
        },
        {
            label: t('swap.total-fees'),
            value: fees || <LoadingDots />,
        },
        {
            label: t('swap.transaction-id'),
            value: transactionId || <LoadingDots />,
        },
        {
            label: t('swap.ethereum-txn'),
            value: status === 'success' ? truncateMiddle(dataAcc.address || '', 5) : <LoadingDots />,
        },
        // {
        //     key: 'Tari Txn',
        //     value: status === 'success' ? truncateMiddle(dataAcc.address || '', 5) : loadingDots,
        // },
    ];

    const ctaMessage = useMemo(() => {
        switch (status) {
            case 'processingapproval':
                return t('swap.awaiting-approval');
            case 'processingswap':
                return t('swap.processing');
            case 'success':
                return t('swap.done');
            case 'error':
                return t('swap.error');
        }
    }, [status, t]);

    const statusIcon = useMemo(() => {
        switch (status) {
            case 'success':
                return <CompletedIcon />;
            default:
                return <ProcessingIcon />;
        }
    }, [status]);

    return (
        <TransactionModal show={isOpen} handleClose={() => setIsOpen(false)}>
            <AnimatePresence mode="wait">
                <StatusHero icon={statusIcon} title={t('swap.your-xtm-is-on-the-way')}>
                    <p>{t('swap.your-purchase-is-processing')}</p>
                </StatusHero>

                <ProcessingDetailsWrapper>
                    <StatusList entries={statusItems} />
                </ProcessingDetailsWrapper>

                <WalletButton
                    variant="primary"
                    size="xl"
                    disabled={status === 'processingswap' || status === 'processingapproval'}
                    onClick={() => setIsOpen(false)}
                >
                    {ctaMessage}
                </WalletButton>
            </AnimatePresence>
        </TransactionModal>
    );
};
