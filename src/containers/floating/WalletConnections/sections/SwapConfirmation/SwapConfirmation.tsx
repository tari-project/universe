import { WalletConnectHeader } from '../../WalletConnections.style';
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
} from './SwapConfirmation.styles';
import { truncateMiddle } from '@app/utils';
import { getCurrencyIcon } from '../../helpers/getIcon';
import { ArrowIcon } from '../../icons/elements/ArrowIcon';
import { StatusList } from '@app/components/transactions/components/StatusList/StatusList';
import TransactionModal from '@app/components/TransactionModal/TransactionModal';
import { AnimatePresence } from 'motion/react';
import { useAccount } from 'wagmi';
import { useMemo } from 'react';
import { SelectableTokenInfo } from '@app/components/transactions/wallet/Swap/useSwapData';
import { useTranslation } from 'react-i18next';

interface Props {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onConfirm: () => void;
    fromTokenDisplay?: SelectableTokenInfo;
    transaction: {
        amount: string;
        targetAmount: string;
        direction: 'input' | 'output';
        slippage?: string | null;
        networkFee?: string | null;
        priceImpact?: string | null;
        transactionId?: string | null;
    };
}
export const SwapConfirmation = ({ isOpen, setIsOpen, transaction, onConfirm, fromTokenDisplay }: Props) => {
    const { amount, targetAmount, direction, slippage, networkFee, priceImpact } = transaction;
    const { t } = useTranslation(['wallet'], { useSuspense: false });

    const dataAcc = useAccount();
    const activeChainIcon = useMemo(() => {
        if (!fromTokenDisplay?.symbol) return null;
        return getCurrencyIcon({
            simbol: fromTokenDisplay.symbol.toLowerCase(),
            width: 10,
        });
    }, [fromTokenDisplay?.symbol]);

    const items = [
        {
            label: t('swap.network-fee'),
            value: networkFee,
            valueRight: `${networkFee} XTM`,
            helpText: `${networkFee} XTM`,
        },
        {
            label: t('swap.network-cost'),
            value: priceImpact,
            helpText: `${priceImpact} XTM`,
        },
        {
            label: t('swap.you-will-receive'),
            value: slippage,
            helpText: t('swap.you-will-receive'),
        },
        {
            label: t('swap.slippage-tolerance'),
            value: slippage,
            helpText: t('swap.you-will-receive'),
        },
        {
            label: t('swap.price-impact'),
            value: priceImpact,
            helpText: t('swap.you-will-receive'),
        },
    ];

    return (
        <TransactionModal show={isOpen} handleClose={() => setIsOpen(false)} noHeader>
            <AnimatePresence mode="wait">
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
                            <SwapAmountInput
                                disabled
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={amount}
                            />
                            <SwapOptionCurrency>
                                {getCurrencyIcon({ simbol: fromTokenDisplay?.symbol || '', width: 10 })}
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
                                {getCurrencyIcon({ simbol: 'xtm', width: 15 })}
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
            </AnimatePresence>
        </TransactionModal>
    );
};
