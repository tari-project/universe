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
import { StatusList } from '@app/components/transactions/components/StatusList/StatusList';
import TransactionModal from '@app/components/TransactionModal/TransactionModal';
import { useAccount } from 'wagmi';
import { useMemo } from 'react';
import { SelectableTokenInfo } from '@app/components/transactions/wallet/Swap/useSwapData';
import { useTranslation } from 'react-i18next';
import { SwapDirection as SwapDirectionType } from '@app/hooks/swap/lib/types';

interface Props {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onConfirm: () => void;
    fromTokenDisplay?: SelectableTokenInfo;
    transaction: {
        amount: string;
        targetAmount: string;
        direction: SwapDirectionType;
        slippage?: string | null;
        networkFee?: string | null;
        priceImpact?: string | null;
        transactionId?: string | null;
    };
}
export const SwapConfirmation = ({ isOpen, setIsOpen, transaction, onConfirm, fromTokenDisplay }: Props) => {
    const { amount, targetAmount, direction, slippage, networkFee } = transaction;
    const { t } = useTranslation(['wallet'], { useSuspense: false });

    const dataAcc = useAccount();
    const activeChainIcon = useMemo(() => {
        if (!fromTokenDisplay?.symbol) return null;
        return getCurrencyIcon({
            symbol: fromTokenDisplay.symbol,
            width: 20,
        });
    }, [fromTokenDisplay?.symbol]);

    const toSymbol = direction === 'toXtm' ? 'XTM' : (fromTokenDisplay?.symbol ?? '');

    const items = [
        // {
        //     label: t('swap.network-fee'),
        //     value: networkFee,
        //     valueRight: `${networkFee} ${toSymbol}`,
        //     helpText: `${networkFee} ${toSymbol}`,
        // },
        {
            label: t('swap.network-cost'),
            value: networkFee,
            helpText: `${networkFee}`,
        },
        {
            label: t('swap.you-will-receive').replace('{{symbol}}', toSymbol),
            value: direction === 'toXtm' ? targetAmount : amount,
        },
        {
            label: t('swap.slippage-tolerance'),
            value: slippage,
        },
        // {
        //     label: t('swap.price-impact'),
        //     value: priceImpact,
        // },
    ];

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
                            {getCurrencyIcon({ symbol: 'XTM', width: 25 })}
                            <span>{'XTM'}</span>
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
