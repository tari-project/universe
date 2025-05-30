import { WalletButton } from '../../components/WalletButton/WalletButton';
// import { setWalletConnectModalStep } from '@app/store/actions/walletStoreActions';
// import { SwapStep } from '@app/store';
import {
    SelectedChain,
    SelectedChainInfo,
    SwapAmountInput,
    SwapDetails,
    // NewOutputAmount,
    // NewOutputWrapper,
    // SwapDetailsKey,
    // SwapDetailsValue,
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
import { useAccount } from 'wagmi';
import { useMemo } from 'react';
import { SelectableTokenInfo } from '@app/components/transactions/wallet/Swap/useSwapData';
import { useTranslation } from 'react-i18next';
import { SwapDirection as SwapDirectionType } from '@app/hooks/swap/lib/types';
import { EnabledTokensEnum } from '@app/hooks/swap/lib/constants';

interface Props {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onConfirm: () => void;
    fromTokenDisplay?: SelectableTokenInfo;
    toTokenSymbol?: string; // Added to determine the "Receive" token symbol
    transaction: {
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
    };
}
export const SwapConfirmation = ({
    isOpen,
    setIsOpen,
    transaction,
    onConfirm,
    fromTokenDisplay,
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
    } = transaction;
    const { t } = useTranslation(['wallet'], { useSuspense: false });

    const dataAcc = useAccount();
    const activeChainIcon = useMemo(() => {
        if (!fromTokenDisplay?.symbol) return null;
        return getCurrencyIcon({
            symbol: fromTokenDisplay.symbol,
            width: 20,
        });
    }, [fromTokenDisplay?.symbol]);

    const receiveTokenSymbol = useMemo(() => {
        if (toTokenSymbol) return toTokenSymbol;
        return direction === 'toXtm' ? EnabledTokensEnum.WXTM : (fromTokenDisplay?.symbol ?? '');
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
                label: t('swap.network-cost'), // Estimated Network Cost
                value: `${networkFee} (gas units est.)`,

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

    return (
        <TransactionModal show={isOpen} handleClose={() => setIsOpen(false)} noHeader>
            <div>
                <WalletConnectHeader>
                    <span />
                    <SelectedChain>
                        {activeChainIcon}
                        <SelectedChainInfo>
                            <span className="address">{truncateMiddle(dataAcc.address || '', 6)}</span>
                            <span className="chain">
                                {fromTokenDisplay?.symbol} {dataAcc.chain?.testnet ? '(TESTNET)' : 'MAINNET'}
                            </span>
                        </SelectedChainInfo>
                    </SelectedChain>
                </WalletConnectHeader>

                <SwapOption>
                    <span> {t('swap.sell')} </span>
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
                <SwapDirection>
                    <SwapDirectionWrapper $direction={direction}>
                        <ArrowIcon width={15} />
                    </SwapDirectionWrapper>
                </SwapDirection>
                <SwapOption>
                    <span> {t('swap.receive-estimated')} </span>
                    <SwapOptionAmount>
                        <SwapAmountInput
                            disabled
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={targetAmount}
                        />
                        <SwapOptionCurrency>
                            {getCurrencyIcon({ symbol: receiveTokenSymbol as EnabledTokensEnum, width: 25 })}
                            <span>{receiveTokenSymbol}</span>
                        </SwapOptionCurrency>
                    </SwapOptionAmount>
                </SwapOption>

                <SwapDetails>
                    {
                        // <NewOutputWrapper>
                        //     <NewOutputAmount>
                        //         <SwapDetailsKey>{t('swap.new-output')}</SwapDetailsKey>
                        //         <SwapDetailsValue>{1.074234}</SwapDetailsValue>
                        //     </NewOutputAmount>
                        //     <WalletButton
                        //         variant="success"
                        //         onClick={() => setWalletConnectModalStep(SwapStep.WalletContents)}
                        //         size="medium"
                        //     >
                        //         {t('swap.accept')}
                        //     </WalletButton>
                        // </NewOutputWrapper>
                    }

                    <StatusList entries={items} />
                </SwapDetails>

                <WalletButton variant="primary" onClick={onConfirm} size="xl">
                    {t('swap.approve-and-buy')}
                </WalletButton>
            </div>
        </TransactionModal>
    );
};
