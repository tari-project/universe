import { ProcessingDetailsWrapper, StatusValue } from './ProcessingTransaction.styles';
import { WalletButton } from '../../components/WalletButton/WalletButton';
import TransactionModal from '@app/components/TransactionModal/TransactionModal';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StatusList, StatusListEntry } from '@app/components/transactions/components/StatusList/StatusList';
import { StatusHero } from '@app/components/transactions/components/StatusHero/StatusHero';
import ProcessingIcon from '@app/components/transactions/send/SendReview/icons/ProcessingIcon';
import LoadingDots from '@app/components/elements/loaders/LoadingDots';
import CompletedIcon from '@app/components/transactions/send/SendReview/icons/CompletedIcon';
import { SwapStatus } from '@app/hooks/swap/lib/types';

export interface ProccessingTransactionProps {
    status?: SwapStatus;
    fees?: { approval: string | null; swap: string | null };
    transactionId?: string | null; // Hash of the swap transaction
    txBlockHash?: `0x${string}` | null;
    errorMessage?: string | null; // Added for error status
}

interface Props extends ProccessingTransactionProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const mainnetExplorerUrl = 'https://etherscan.io';

export const ProcessingTransaction = ({
    status,
    isOpen,
    setIsOpen,
    transactionId,
    fees,
    txBlockHash,
    errorMessage,
}: Props) => {
    const { t } = useTranslation(['wallet'], { useSuspense: false });
    const explorerUrl = mainnetExplorerUrl;

    const statusItems: StatusListEntry[] = useMemo(() => {
        const items: StatusListEntry[] = [];

        items.push({
            label: t('swap.status'),
            value: (
                <StatusValue $status={status}>
                    {status === 'success' && t('swap.completed')}
                    {(status === 'processingapproval' || status === 'processingswap') && t('swap.processing')}
                    {status === 'error' && t('swap.failed')}
                </StatusValue>
            ),
        });

        items.push({
            label: t('swap.total-fees-swap'),
            value: fees?.swap ?? <LoadingDots />,
        });
        items.push({
            label: t('swap.transaction-id'),
            externalLink: transactionId ? `${explorerUrl}/tx/${transactionId}` : undefined,
            value: transactionId ? transactionId : <LoadingDots />,
        });
        items.push({
            label: t('swap.block-hash'),
            externalLink: txBlockHash ? `${explorerUrl}/block/${txBlockHash}` : undefined,
            value: txBlockHash ? txBlockHash : <LoadingDots />,
        });

        if (status === 'error' && errorMessage) {
            items.push({
                label: t('swap.error-message'),
                value: <span style={{ color: 'red', wordBreak: 'break-word' }}>{errorMessage}</span>, // Basic styling for error
            });
        }

        return items.filter((item) => item.value !== undefined);
    }, [status, fees, transactionId, txBlockHash, errorMessage, t, explorerUrl]);

    const heroTitle = useMemo(() => {
        switch (status) {
            case 'processingapproval':
                return t('swap.approving-spend');
            case 'processingswap':
                return t('swap.processing-swap');
            case 'success':
                return t('swap.swap-successful');
            case 'error':
                return t('swap.swap-failed');
        }
    }, [status, t]);

    const heroMessage = useMemo(() => {
        switch (status) {
            case 'processingapproval':
                return t('swap.please-confirm-approval-in-wallet');
            case 'processingswap':
                return t('swap.your-transaction-is-being-processed');
            case 'success':
                return t('swap.your-tokens-have-been-swapped');
            case 'error':
                return t('swap.transaction-could-not-be-completed');
        }
    }, [status, t]);

    const ctaMessage = useMemo(() => {
        switch (status) {
            case 'processingapproval':
                return t('swap.awaiting-approval');
            case 'processingswap':
                return t('swap.processing');
            case 'success':
                return t('swap.done');
            case 'error':
                return t('swap.close'); // Or "Try Again" if you have that logic
        }
    }, [status, t]);

    const statusIcon = useMemo(() => {
        switch (status) {
            case 'success':
                return <CompletedIcon />;
            // case 'error':
            //     return <ErrorIcon />;
            default: // processingapproval, processingswap
                return <ProcessingIcon />;
        }
    }, [status]);

    return (
        <TransactionModal show={isOpen} handleClose={() => setIsOpen(false)}>
            <StatusHero icon={statusIcon} title={heroTitle || ''}>
                <p>{heroMessage}</p>
            </StatusHero>

            <ProcessingDetailsWrapper>
                <StatusList entries={statusItems} />
            </ProcessingDetailsWrapper>

            <WalletButton
                variant={status === 'error' ? 'error' : 'primary'} // Example: use danger variant for error
                size="xl"
                disabled={status === 'processingswap' || status === 'processingapproval'}
                onClick={() => setIsOpen(false)}
            >
                {ctaMessage}
            </WalletButton>
        </TransactionModal>
    );
};
