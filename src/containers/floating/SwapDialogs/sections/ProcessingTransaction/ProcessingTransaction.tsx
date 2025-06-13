import {
    CopyIconWrapper,
    CopyText,
    HelperText,
    OfficialContractAddressConainer,
    OfficialContractAddressWrapper,
    ProcessingDetailsWrapper,
    StatusValue,
} from './ProcessingTransaction.styles';
import { WalletButton } from '../../components/WalletButton/WalletButton';
import TransactionModal from '@app/components/TransactionModal/TransactionModal';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatusList, StatusListEntry } from '@app/components/transactions/components/StatusList/StatusList';
import { StatusHero } from '@app/components/transactions/components/StatusHero/StatusHero';
import ProcessingIcon from '@app/components/transactions/send/SendReview/icons/ProcessingIcon';
import LoadingDots from '@app/components/elements/loaders/LoadingDots';
import CompletedIcon from '@app/components/transactions/send/SendReview/icons/CompletedIcon';
import { SwapStatus } from '@app/hooks/swap/lib/types';
import { truncateMiddle } from '@app/utils';
import { CopyIcon } from '../../icons/copyIcon';
import { AnimatePresence } from 'motion/react';

export interface ProccessingTransactionProps {
    status?: SwapStatus;
    fees?: { approval: string | null; swap: string | null };
    transactionId?: string | null; // Hash of the swap transaction
    txBlockHash?: `0x${string}` | null;
    errorMessage?: string | null; // Added for error status
    fromTokenSymbol?: string;
    fromTokenAmount?: string;
    toTokenSymbol?: string;
    toTokenAmount?: string;
    handleAddXtmToWallet?: () => void;
}

interface Props extends ProccessingTransactionProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const mainnetExplorerUrl = 'https://etherscan.io';
const CONTRACT_ADDRESS = '0xfD36fA88bb3feA8D1264fc89d70723b6a2B56958';

export const ProcessingTransaction = ({
    handleAddXtmToWallet,
    status,
    isOpen,
    setIsOpen,
    transactionId,
    fromTokenSymbol,
    fromTokenAmount,
    toTokenSymbol,
    toTokenAmount,
    fees,
    txBlockHash,
    errorMessage,
}: Props) => {
    const { t } = useTranslation(['wallet'], { useSuspense: false });
    const explorerUrl = mainnetExplorerUrl;
    const [copied, setCopied] = useState(false);

    const handleCopyAddress = useCallback(() => {
        navigator.clipboard.writeText(CONTRACT_ADDRESS);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }, []);

    const statusItems: StatusListEntry[] = useMemo(() => {
        const items: StatusListEntry[] = [];

        if (status === 'processingswap') {
            items.push({
                label: 'Official wXTM Contract Address',
                value: CONTRACT_ADDRESS,
            });
        }

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
            value: transactionId ? truncateMiddle(transactionId, 15) : <LoadingDots />,
        });

        items.push({
            label: t('swap.block-hash'),
            externalLink: txBlockHash ? `${explorerUrl}/block/${txBlockHash}` : undefined,
            value: txBlockHash ? truncateMiddle(txBlockHash, 15) : <LoadingDots />,
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
            case 'processingswap':
                return 'Confirm swap in wallet';
            case 'success':
                return 'Swapped!';
            case 'error':
                return t('swap.swap-failed');
        }
    }, [status, t]);

    const heroMessage = useMemo(() => {
        switch (status) {
            case 'processingapproval':
            case 'processingswap':
                return `Please approve the transaction request in your connected wallet.`;
            case 'success':
                return `You’ve successfully swapped ${fromTokenAmount} ${fromTokenSymbol} for ${toTokenAmount} ${toTokenSymbol}`;
            case 'error':
                return t('swap.transaction-could-not-be-completed');
        }
    }, [fromTokenAmount, fromTokenSymbol, status, t, toTokenAmount, toTokenSymbol]);

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

            {status === 'success' && (
                <>
                    <OfficialContractAddressConainer>
                        <OfficialContractAddressWrapper>
                            <span className="label">{'Official wXTM Token Address'}</span>
                            <span className="address">{CONTRACT_ADDRESS}</span>
                        </OfficialContractAddressWrapper>
                        <CopyIconWrapper onClick={handleCopyAddress}>
                            <CopyIcon size={16} />
                            <AnimatePresence>
                                {copied && (
                                    <CopyText
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                    >
                                        {'Copied!'}
                                    </CopyText>
                                )}
                            </AnimatePresence>
                        </CopyIconWrapper>
                    </OfficialContractAddressConainer>
                    <HelperText>
                        <div className="strong">{'How to view wXTM in your wallet?'}</div>
                        <div>
                            {'To see your balance, add wXTM to your wallet by importing the '}
                            <span className="strong">{'token address'}</span>
                            {' on the '}
                            <span className="strong">{'Ethereum mainnet'}</span>
                            {' network. Alternatively, '}
                            <span className="btn" onClick={handleAddXtmToWallet}>
                                {'click here'}
                            </span>
                            {
                                " to send the request directly to your mobile wallet app—you'll need to approve it on your phone."
                            }
                        </div>
                    </HelperText>
                </>
            )}

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
