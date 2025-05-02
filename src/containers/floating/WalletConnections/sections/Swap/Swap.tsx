import { WalletConnectHeader } from '../../WalletConnections.style';
import { WalletButton } from '../../components/WalletButton/WalletButton';
import { setWalletConnectModalStep } from '@app/store/actions/walletStoreActions';
import { SwapStep } from '@app/store';
import {
    NewOutputAmount,
    NewOutputWrapper,
    PoweredBy,
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
} from './Swap.styles';
import { useAccount, useBalance } from 'wagmi';
import { truncateMiddle } from '@app/utils';
import { getIcon } from '../../helpers/getIcon';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowIcon } from '../../icons/elements/ArrowIcon';
import PortalLogo from '../../icons/PortalLogo.png';
// import { SignMessage } from '../SignMessage/SignMessage';
import { useToastStore } from '@app/components/ToastStack/useToastStore';
import { StatusList } from '@app/components/transactions/components/StatusList/StatusList';
import { useSwap } from '@app/hooks/swap/useSwap';
import { WETH9 } from '@uniswap/sdk-core';

enum Field {
    AMOUNT = 'amount',
    TARGET = 'target',
}

export const Swap = () => {
    // const [signMessageModalOpen, setSignMessageModalOpen] = useState(false);
    const dataAcc = useAccount();
    const { data: accountBalance } = useBalance({ address: WETH9[dataAcc.chain?.id ?? 1].address as `0x${string}` });
    const activeChainIcon = useMemo(() => {
        if (!accountBalance?.symbol) return null;
        return getIcon({
            simbol: accountBalance?.symbol,
            width: 10,
        });
    }, [accountBalance?.symbol]);

    console.log(accountBalance);

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

    const [networkFee, setNetworkFee] = useState<string>('');
    const [slippage, setSlippage] = useState<string>('');
    const [priceImpact, setPriceImpact] = useState<string>('');
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

            const networkFee = trade.priceImpact.toSignificant(6);
            setNetworkFee(networkFee);

            const slippage = trade.priceImpact.toSignificant(6);
            setSlippage(slippage);

            const priceImpact = trade.priceImpact.toSignificant(6);
            setPriceImpact(priceImpact);

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
        // setSignMessageModalOpen(true);
        // signMessageAsync({ message: 'Hello sign this test message' })
        //     .then(() => setWalletConnectModalStep(SwapStep.Progress))
        //     .catch(() => {
        //         addToast({
        //             title: 'Error',
        //             text: 'Something went wrong',
        //             type: 'error',
        //         });
        //         setWalletConnectModalStep(SwapStep.ConnectWallet);
        //     });
    };

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
        return (Number(accountBalance.value) / Number(factor)).toString();
    }, [accountBalance]);

    // if (signMessageModalOpen) {
    //     return <SignMessage />;
    // }

    return (
        <>
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
                        type="text"
                        error={notEnoughBalance && direction === 'input'}
                        inputMode="decimal"
                        placeholder="0.00"
                        onChange={(e) => handleNumberInput(e.target.value, setAmount, Field.AMOUNT)}
                        onBlur={() => setAmount((amount) => Number(amount).toString())}
                        value={amount}
                    />
                    <SwapOptionCurrency>
                        {getIcon({ simbol: accountBalance?.symbol || '', width: 10 })}
                        <span>{accountBalance?.symbol}</span>
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
                        {getIcon({ simbol: 'xtm', width: 15 })}
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

            <WalletButton variant="primary" onClick={handleConfirm} size="xl">
                {'Approve & Buy'}
            </WalletButton>

            <PoweredBy>
                {'Powered by'}
                <img src={PortalLogo} alt="Portal to Bitcoin" width={50} />
            </PoweredBy>
        </>
    );
};
