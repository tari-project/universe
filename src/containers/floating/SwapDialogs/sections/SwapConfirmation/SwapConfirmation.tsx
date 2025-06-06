import { WalletButton } from '../../components/WalletButton/WalletButton';
import {
    SelectedChain,
    SelectedChainInfo,
    SwapAmountInput,
    SwapDetails,
    SwapDirection,
    SwapDirectionWrapper,
    SwapOption,
    SwapOptionAmount,
    SwapOptionCurrency,
    WalletConnectHeader,
} from './SwapConfirmation.styles';
import { truncateMiddle } from '@app/utils';
import { getCurrencyIcon } from '../../helpers/getIcon';
import { ArrowIcon } from '../../icons/elements/ArrowIcon';
import { StatusList, StatusListEntry } from '@app/components/transactions/components/StatusList/StatusList';
import TransactionModal from '@app/components/TransactionModal/TransactionModal';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SelectableTokenInfo, SwapDirection as SwapDirectionType } from '@app/hooks/swap/lib/types';

export interface SwapConfirmationTransactionProps {
    fromTokenDisplay?: SelectableTokenInfo;
    toTokenDisplay?: SelectableTokenInfo;
    toTokenSymbol?: string; // Added to determine the "Receive" token symbol
    transaction?: {
        amount: string;
        targetAmount: string;
        direction: SwapDirectionType;
        slippage?: string | null;
        networkFee?: string | null; // Estimated network fee for the swap
        priceImpact?: string | null;
        minimumReceived?: string | null; // Added
        executionPrice?: string | null; // Added
        transactionId?: string | null;
        paidTransactionFee?: string | null; // Added: Actual fee paid
        destinationAddress?: string | null;
    };
}

interface Props extends SwapConfirmationTransactionProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onConfirm: () => void;
}

export const SwapConfirmation = ({
    isOpen,
    setIsOpen,
    transaction,
    onConfirm,
    fromTokenDisplay,
    toTokenDisplay,
    toTokenSymbol,
}: Props) => {
    const {
        amount,
        targetAmount,
        direction,
        networkFee,
        priceImpact,
        minimumReceived,
        executionPrice,
        paidTransactionFee,
        transactionId,
    } = transaction || {};

    const { t } = useTranslation(['wallet'], { useSuspense: false });

    const activeChainIcon = useMemo(() => {
        if (!fromTokenDisplay?.symbol) return null;
        return getCurrencyIcon({
            symbol: 'eth',
            width: 20,
        });
    }, [fromTokenDisplay?.symbol]);

    const receiveTokenSymbol = useMemo(() => {
        if (toTokenSymbol) return toTokenSymbol;
        return direction === 'toXtm' ? 'wXTM' : (fromTokenDisplay?.symbol ?? '');
    }, [direction, fromTokenDisplay?.symbol, toTokenSymbol]);

    const items = useMemo(() => {
        const baseItems: StatusListEntry[] = [];

        if (executionPrice) {
            baseItems.push({
                label: t('swap.rate'),
                value: executionPrice,
            });
        }

        if (networkFee) {
            baseItems.push({
                label: t('swap.network-cost'),
                value: `${networkFee}`,

                helpText: networkFee,
            });
        }

        if (minimumReceived) {
            baseItems.push({
                label: t('swap.minimum-received'),
                value: minimumReceived,
            });
        }

        if (priceImpact) {
            baseItems.push({
                label: t('swap.price-impact'),
                value: priceImpact,
            });
        }

        if (transactionId && paidTransactionFee) {
            baseItems.push({
                label: t('swap.transaction-fee-paid'),
                value: paidTransactionFee,
            });
        }

        return baseItems.filter((item) => item.value !== null && item.value !== undefined);
    }, [executionPrice, networkFee, minimumReceived, priceImpact, t, transactionId, paidTransactionFee]);

    const xtmOptionMarkup = useMemo(() => {
        return (
            <SwapOption>
                <span> {direction === 'toXtm' ? t('swap.receive-estimated') : t('swap.sell')} </span>
                <SwapOptionAmount>
                    <SwapAmountInput disabled type="text" inputMode="decimal" placeholder="0.00" value={targetAmount} />
                    <SwapOptionCurrency>
                        {getCurrencyIcon({ symbol: receiveTokenSymbol, width: 25 })}
                        <span>{receiveTokenSymbol}</span>
                    </SwapOptionCurrency>
                </SwapOptionAmount>
                <span>{toTokenDisplay?.balance}</span>
            </SwapOption>
        );
    }, [direction, receiveTokenSymbol, t, targetAmount, toTokenDisplay?.balance]);

    const ethOptionMarkup = useMemo(() => {
        return (
            <SwapOption>
                <span> {direction === 'toXtm' ? t('swap.sell') : t('swap.receive-estimated')} </span>
                <SwapOptionAmount>
                    <SwapAmountInput disabled type="text" inputMode="decimal" placeholder="0.00" value={amount} />
                    <SwapOptionCurrency>
                        {fromTokenDisplay?.symbol
                            ? getCurrencyIcon({ symbol: fromTokenDisplay?.symbol, width: 25 })
                            : null}
                        <span>{fromTokenDisplay?.symbol}</span>
                    </SwapOptionCurrency>
                </SwapOptionAmount>
                <span>{fromTokenDisplay?.balance}</span>
            </SwapOption>
        );
    }, [direction, t, amount, fromTokenDisplay?.symbol, fromTokenDisplay?.balance]);

    return (
        <TransactionModal show={isOpen} handleClose={() => setIsOpen(false)} noHeader>
            <div>
                <WalletConnectHeader>
                    <span />
                    <SelectedChain>
                        {activeChainIcon}
                        <SelectedChainInfo>
                            <span className="address">{truncateMiddle(transaction?.destinationAddress || '', 6)}</span>
                            <span className="chain">{'ETH'}</span>
                        </SelectedChainInfo>
                    </SelectedChain>
                </WalletConnectHeader>

                {direction === 'toXtm' ? ethOptionMarkup : xtmOptionMarkup}

                <SwapDirection>
                    <SwapDirectionWrapper $direction={'toXtm'}>
                        <ArrowIcon width={15} />
                    </SwapDirectionWrapper>
                </SwapDirection>

                {direction === 'toXtm' ? xtmOptionMarkup : ethOptionMarkup}

                <SwapDetails>
                    <StatusList entries={items} />
                </SwapDetails>

                <WalletButton variant="primary" onClick={onConfirm} size="xl">
                    {t('swap.approve-and-buy')}
                </WalletButton>
            </div>
        </TransactionModal>
    );
};
