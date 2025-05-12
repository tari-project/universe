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
import { useAccount, useBalance } from 'wagmi';
import { useMemo } from 'react';

interface Props {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onConfirm: () => void;
    trannsaction: {
        amount: string;
        targetAmount: string;
        direction: 'input' | 'output';
        slippage: string;
        networkFee: string;
        priceImpact: string;
        transactionId: string;
    };
}
export const SwapConfirmation = ({ isOpen, setIsOpen, trannsaction, onConfirm }: Props) => {
    const { amount, targetAmount, direction, slippage, networkFee, priceImpact } = trannsaction;

    const dataAcc = useAccount();
    const { data: accountBalance } = useBalance({ address: dataAcc.address });
    const activeChainIcon = useMemo(() => {
        if (!accountBalance?.symbol) return null;
        return getCurrencyIcon({
            simbol: accountBalance?.symbol,
            width: 10,
        });
    }, [accountBalance?.symbol]);

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
        if (!accountBalance?.value) return 0;
        const factor = 10n ** BigInt(accountBalance.decimals);
        return (Number(accountBalance.value) / Number(factor)).toFixed(6);
    }, [accountBalance]);

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
                                    {accountBalance?.symbol} {dataAcc.chain?.testnet ? '(TESTNET)' : 'MAINNET'}
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
                                {getCurrencyIcon({ simbol: accountBalance?.symbol || '', width: 10 })}
                                <span>{accountBalance?.symbol}</span>
                            </SwapOptionCurrency>
                        </SwapOptionAmount>
                        <span>
                            {accountBalanceValue} {accountBalance?.symbol}
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
