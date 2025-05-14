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
import { useTranslation } from 'react-i18next';

export type SwapStatus = 'processingapproval' | 'processingswap' | 'success' | 'error';

interface Props {
    status: SwapStatus;
    isOpen: boolean;
    fees?: string;
    setIsOpen: (isOpen: boolean) => void;
    transactionId?: string;
}

export const ProcessingTransaction = ({ status, isOpen, setIsOpen, transactionId, fees }: Props) => {
    const dataAcc = useAccount();
    const { t } = useTranslation(['wallet'], { useSuspense: false });

    const loadingDots = (
        <LoadingDots>
            <span>.</span>
            <span>.</span>
            <span>.</span>
        </LoadingDots>
    );
    const statusItems = [
        {
            key: t('swap.status'),
            value: (
                <StatusValue $status={status}>
                    {status === 'success' ? t('swap.completed') : t('swap.processing')}
                </StatusValue>
            ),
        },
        {
            key: t('swap.total-fees'),
            value: fees || loadingDots,
        },
        {
            key: t('swap.transaction-id'),
            value: transactionId || loadingDots,
        },
        {
            key: 'Ethereum Txn',
            value: status === 'success' ? truncateMiddle(dataAcc.address || '', 5) : loadingDots,
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
    return (
        <TransactionModal show={isOpen} handleClose={() => setIsOpen(false)}>
            <AnimatePresence mode="wait">
                <HeaderWrapper>
                    {status === 'success' ? <SuccessIcon width="65" /> : <LoadingClock width="65" />}
                    <h3>{t('swap.your-xtm-is-on-the-way')}</h3>
                    <p>{t('swap.your-purchase-is-processing')}</p>
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
