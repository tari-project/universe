import {
    SwapAmountInput,
    SwapDirection,
    SwapDirectionWrapper,
    SwapOption,
    SwapOptionAmount,
    SwapOptionCurrency,
} from './Swap.styles';
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import { SignMessage } from '../SignMessage/SignMessage';
import { useToastStore } from '@app/components/ToastStack/useToastStore';
import { useSwap } from '@app/hooks/swap/useSwap';
import { getCurrencyIcon } from '@app/containers/floating/WalletConnections/helpers/getIcon';
import { ArrowIcon } from '@app/containers/floating/WalletConnections/icons/elements/ArrowIcon';
import { WalletButton } from '@app/containers/floating/WalletConnections/components/WalletButton/WalletButton';
import { setReviewSwap } from '@app/store/actions/walletStoreActions';

enum Field {
    AMOUNT = 'amount',
    TARGET = 'target',
}

export const Swap = () => {
    // const [signMessageModalOpen, setSignMessageModalOpen] = useState(false);
    const dataAcc = useAccount();
    const { disconnectAsync } = useDisconnect();
    const { data: accountBalance } = useBalance({ address: dataAcc.address });

    const addToast = useToastStore((s) => s.addToast);
    // const { signMessageAsync } = useSignMessage();

    const [amount, setAmount] = useState<string>('');
    const [targetAmount, setTargetAmount] = useState<string>('');
    const [lastUpdatedField, setLastUpdatedField] = useState<Field | undefined>();

    const { direction, setDirection, getTradeDetails, checkAndRequestApproval, executeSwap } = useSwap();

    const notEnoughBalance = useMemo(() => {
        if (direction === 'input') {
            if (!accountBalance?.value) return false;
            const factor = 10n ** BigInt(accountBalance.decimals);
            return Number(accountBalance.value) < Number(amount || 0) * Number(factor);
        }
        return false;
    }, [accountBalance?.decimals, accountBalance?.value, amount, direction]);

    const shouldCalculate = useRef(false);

    const calcRef = useRef<NodeJS.Timeout | null>(null);
    const calcAmounts = useCallback(() => {
        const value = direction === 'input' ? Number(amount || 0) : Number(targetAmount || 0);
        const factor = 10n ** BigInt(accountBalance?.decimals || 0);
        const tradeDetails = getTradeDetails((value * Number(factor)).toString());
        tradeDetails.then((details) => {
            const { trade, route } = details;
            if (!trade || !route) {
                console.error('Could not calculate trade route.');
                return;
            }
            const midPrice = route.midPrice.toSignificant(6);
            const invertedMidPrice = route.midPrice.invert().toSignificant(6);
            // const executionPrice = trade.executionPrice.toSignificant(6);

            if (!shouldCalculate.current) return;

            const invertedDirection = false;
            const amountConversionRate = invertedDirection ? invertedMidPrice : midPrice;
            const targetAmountConversionRate = invertedDirection ? midPrice : invertedMidPrice;

            if (lastUpdatedField === Field.AMOUNT) {
                const newTargetAmount = Number(amount || 1) * Number(targetAmountConversionRate || 0);
                setTargetAmount(newTargetAmount.toString());
            } else if (lastUpdatedField === Field.TARGET) {
                const newAmount = Number(targetAmount || 1) * Number(amountConversionRate || 0);
                setAmount(newAmount.toString());
            }

            shouldCalculate.current = false;
        });
    }, [accountBalance?.decimals, amount, direction, getTradeDetails, lastUpdatedField, targetAmount]);

    // Debounce time is 500ms
    const debounceCalc = useCallback(
        () => {
            if (calcRef.current) {
                clearTimeout(calcRef.current);
            }
            calcRef.current = setTimeout(() => {
                calcAmounts();
            }, 500);
        }, // Debounce time is 500ms
        [calcAmounts]
    );

    useEffect(() => {
        debounceCalc();
    }, [accountBalance?.decimals, amount, debounceCalc, direction, getTradeDetails, lastUpdatedField, targetAmount]);

    const handleNumberInput = (value: string, setter: (value: string) => void, field: Field) => {
        // Allow empty input
        if (value === '') {
            setter('');
            return;
        }

        // Only allow numbers and one decimal point
        const regex = /^\d*\.?\d*$/;
        if (!regex.test(value)) return;

        // Limit decimal places to 8
        const parts = value.split('.');
        if (parts[1] && parts[1].length > 8) return;

        setter(value);
        setLastUpdatedField(field);
        shouldCalculate.current = true;
    };

    const handleConfirm = () => {
        const value = direction === 'input' ? Number(amount || 0) : Number(targetAmount || 0);
        const factor = 10n ** BigInt(accountBalance?.decimals || 0);
        const bigIntValue = BigInt(value * Number(factor));
        checkAndRequestApproval(bigIntValue.toString()).then((approved) => {
            if (!approved) return;
            executeSwap(bigIntValue.toString()).then((hash) => {
                if (!hash) return;
                addToast({
                    title: 'Success',
                    text: 'Swap successful',
                    type: 'success',
                });
            });
        });
    };

    const accountBalanceValue = useMemo(() => {
        if (!accountBalance?.value) return 0;
        const factor = 10n ** BigInt(accountBalance.decimals);
        return (Number(accountBalance.value) / Number(factor)).toString();
    }, [accountBalance]);

    return (
        <>
            {dataAcc?.address && <button onClick={() => disconnectAsync()}>{'Disconnect'}</button>}
            <SwapOption>
                <span> {'Sell'} </span>
                <SwapOptionAmount>
                    <SwapAmountInput
                        type="text"
                        $error={notEnoughBalance && direction === 'input'}
                        inputMode="decimal"
                        placeholder="0.00"
                        onChange={(e) => handleNumberInput(e.target.value, setAmount, Field.AMOUNT)}
                        onBlur={() => setAmount((amount) => Number(amount).toString())}
                        value={amount}
                    />
                    <SwapOptionCurrency>
                        {getCurrencyIcon({ simbol: accountBalance?.symbol || 'eth', width: 10 })}
                        <span>{accountBalance?.symbol || 'ETH'}</span>
                    </SwapOptionCurrency>
                </SwapOptionAmount>
                <span>
                    {accountBalanceValue} {accountBalance?.symbol}
                </span>
            </SwapOption>
            <SwapDirection>
                <SwapDirectionWrapper
                    $direction={direction}
                    onClick={() => setDirection(direction === 'input' ? 'output' : 'input')}
                >
                    <ArrowIcon width={15} />
                </SwapDirectionWrapper>
            </SwapDirection>
            <SwapOption>
                <span> {'Receive'} </span>
                <SwapOptionAmount>
                    <SwapAmountInput
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        onChange={(e) => handleNumberInput(e.target.value, setTargetAmount, Field.TARGET)}
                        onBlur={() => setAmount((amount) => Number(amount).toString())}
                        value={targetAmount}
                    />
                    <SwapOptionCurrency>
                        {getCurrencyIcon({ simbol: 'xtm', width: 15 })}
                        <span>{'XTM'}</span>
                    </SwapOptionCurrency>
                </SwapOptionAmount>
            </SwapOption>

            <div style={{ marginTop: '20px', width: '100%' }}>
                <WalletButton variant="primary" onClick={() => setReviewSwap(true)} size="xl">
                    {'Approve & Buy'}
                </WalletButton>
            </div>
        </>
    );
};
