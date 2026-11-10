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
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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

function resolveStatusLabel(status: SwapStatus | undefined, t: TFunction): string | undefined {
    if (status === 'success') return t('swap.completed');
    if (status === 'processingapproval' || status === 'processingswap') return t('swap.processing');
    if (status === 'error') return t('swap.failed');
    return undefined;
}

function buildStatusEntries(props: ProccessingTransactionProps, t: TFunction): StatusListEntry[] {
    const { status, fees, transactionId, txBlockHash, errorMessage } = props;
    const items: StatusListEntry[] = [];

    if (status === 'processingswap') {
        items.push({
            label: 'Official wXTM Contract Address',
            value: CONTRACT_ADDRESS,
        });
    }

    items.push(
        {
            label: t('swap.status'),
            value: <StatusValue $status={status}>{resolveStatusLabel(status, t)}</StatusValue>,
        },
        {
            label: t('swap.total-fees-swap'),
            value: fees?.swap ?? <LoadingDots />,
        },
        {
            label: t('swap.transaction-id'),
            externalLink: transactionId ? `${mainnetExplorerUrl}/tx/${transactionId}` : undefined,
            value: transactionId ? truncateMiddle(transactionId, 15) : <LoadingDots />,
        },
        {
            label: t('swap.block-hash'),
            externalLink: txBlockHash ? `${mainnetExplorerUrl}/block/${txBlockHash}` : undefined,
            value: txBlockHash ? truncateMiddle(txBlockHash, 15) : <LoadingDots />,
        }
    );

    if (status === 'error' && errorMessage) {
        items.push({
            label: t('swap.error-message'),
            value: <span style={{ color: 'red', wordBreak: 'break-word' }}>{errorMessage}</span>,
        });
    }

    return items.filter((item) => item.value !== undefined);
}

function getHeroCopy(props: ProccessingTransactionProps, t: TFunction) {
    const { status, fromTokenAmount, fromTokenSymbol, toTokenAmount, toTokenSymbol } = props;
    if (status === 'processingapproval' || status === 'processingswap') {
        return {
            title: 'Confirm swap in wallet',
            message: 'Please approve the transaction request in your connected wallet.',
            cta: status === 'processingapproval' ? t('swap.awaiting-approval') : t('swap.processing'),
        };
    }
    if (status === 'success') {
        return {
            title: 'Swapped!',
            message: `You’ve successfully swapped ${fromTokenAmount} ${fromTokenSymbol} for ${toTokenAmount} ${toTokenSymbol}`,
            cta: t('swap.done'),
        };
    }
    if (status === 'error') {
        return {
            title: t('swap.swap-failed'),
            message: t('swap.transaction-could-not-be-completed'),
            cta: t('swap.close'),
        };
    }
    return { title: '', message: undefined, cta: undefined };
}

function SuccessContractSection({
    copied,
    onCopyAddress,
    onAddXtmToWallet,
}: {
    copied: boolean;
    onCopyAddress: () => void;
    onAddXtmToWallet?: () => void;
}) {
    return (
        <>
            <OfficialContractAddressConainer>
                <OfficialContractAddressWrapper>
                    <span className="label">{'Official wXTM Token Address'}</span>
                    <span className="address">{CONTRACT_ADDRESS}</span>
                </OfficialContractAddressWrapper>
                <CopyIconWrapper onClick={onCopyAddress}>
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
                    <span className="btn" onClick={onAddXtmToWallet}>
                        {'click here'}
                    </span>
                    {" to send the request directly to your mobile wallet app - you'll need to approve it on your phone."}
                </div>
            </HelperText>
        </>
    );
}

export const ProcessingTransaction = (props: Props) => {
    const {
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
    } = props;
    const { t } = useTranslation(['wallet'], { useSuspense: false });
    const { copyToClipboard, isCopied: copied } = useCopyToClipboard();

    const handleCopyAddress = useCallback(() => {
        copyToClipboard(CONTRACT_ADDRESS);
    }, [copyToClipboard]);

    const statusItems = useMemo(
        () => buildStatusEntries({ status, fees, transactionId, txBlockHash, errorMessage }, t),
        [status, fees, transactionId, txBlockHash, errorMessage, t]
    );

    const hero = useMemo(
        () => getHeroCopy({ status, fromTokenAmount, fromTokenSymbol, toTokenAmount, toTokenSymbol }, t),
        [status, fromTokenAmount, fromTokenSymbol, toTokenAmount, toTokenSymbol, t]
    );

    const statusIcon = status === 'success' ? <CompletedIcon /> : <ProcessingIcon />;
    const isBusy = status === 'processingswap' || status === 'processingapproval';

    return (
        <TransactionModal show={isOpen} handleClose={() => setIsOpen(false)}>
            <StatusHero icon={statusIcon} title={hero.title}>
                <p>{hero.message}</p>
            </StatusHero>

            {status === 'success' && (
                <SuccessContractSection
                    copied={copied}
                    onCopyAddress={handleCopyAddress}
                    onAddXtmToWallet={handleAddXtmToWallet}
                />
            )}

            <ProcessingDetailsWrapper>
                <StatusList entries={statusItems} />
            </ProcessingDetailsWrapper>

            <WalletButton
                variant={status === 'error' ? 'error' : 'primary'}
                size="xl"
                disabled={isBusy}
                onClick={() => setIsOpen(false)}
            >
                {hero.cta}
            </WalletButton>
        </TransactionModal>
    );
};
