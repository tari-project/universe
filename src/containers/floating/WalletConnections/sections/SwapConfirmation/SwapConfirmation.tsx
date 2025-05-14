import { WalletConnectHeader } from '../../WalletConnections.style';
import { WalletButton } from '../../components/WalletButton/WalletButton';
import { setWalletConnectModalStep } from '@app/store/actions/walletStoreActions';
import { SwapStep } from '@app/store';
import {
    NewOutputAmount,
    NewOutputWrapper,
    SelectedChain,
    SelectedChainInfo,
    SwapAmountInput,
    SwapDetails,
    SwapDetailsKey,
    SwapDetailsValue,
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
            label: 'Network fee',
            value: networkFee,
            valueRight: `${networkFee} XTM`,
            helpText: `${networkFee} XTM`,
        },
        {
            label: 'Network Cost',
            value: priceImpact,
            helpText: `${priceImpact} XTM`,
        },
        {
            label: 'You will receive XTM in (Tari wallet address)',
            value: slippage,
            helpText: 'You will receive XTM in (Tari wallet address)',
        },
        {
            label: 'Slippage',
            value: slippage,
            helpText: 'You will receive XTM in (Tari wallet address)',
        },
        {
            label: 'Price Impact',
            value: priceImpact,
            helpText: 'You will receive XTM in (Tari wallet address)',
        },
    ];

    const accountBalanceValue = useMemo(() => {
        if (!fromTokenDisplay?.balance) return 0;
        return Number(fromTokenDisplay.balance);
    }, [fromTokenDisplay?.balance]);

    return (
        <TransactionModal show={isOpen} handleClose={() => setIsOpen(false)}>
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
                        <span> {'Sell'} </span>
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
                        <span>
                            {accountBalanceValue} {fromTokenDisplay?.symbol}
                        </span>
                    </SwapOption>
                    <SwapDirection>
                        <SwapDirectionWrapper $direction={direction}>
                            <ArrowIcon width={15} />
                        </SwapDirectionWrapper>
                    </SwapDirection>
                    <SwapOption>
                        <span> {'Receive'} </span>
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
                        <NewOutputWrapper>
                            <NewOutputAmount>
                                <SwapDetailsKey>{'New output'}</SwapDetailsKey>
                                <SwapDetailsValue>{1.074234}</SwapDetailsValue>
                            </NewOutputAmount>
                            <WalletButton
                                variant="success"
                                onClick={() => setWalletConnectModalStep(SwapStep.WalletContents)}
                                size="medium"
                            >
                                {'Accept'}
                            </WalletButton>
                        </NewOutputWrapper>

                        <StatusList entries={items} />
                    </SwapDetails>

                    <WalletButton variant="primary" onClick={onConfirm} size="xl">
                        {'Approve & Buy'}
                    </WalletButton>
                </div>
            </AnimatePresence>
        </TransactionModal>
    );
};
