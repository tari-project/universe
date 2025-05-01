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
import { useAccount, useBalance, useSignMessage } from 'wagmi';
import { truncateMiddle } from '@app/utils';
import { getIcon } from '../../helpers/getIcon';
import { useEffect, useMemo, useState } from 'react';
import { ArrowIcon } from '../../icons/elements/ArrowIcon';
import PortalLogo from '../../icons/PortalLogo.png';
import { SignMessage } from '../SignMessage/SignMessage';
import { useToastStore } from '@app/components/ToastStack/useToastStore';
import { StatusList } from '@app/components/transactions/components/StatusList/StatusList';
import { useSwap } from '@app/hooks/swap/useSwap2';
import useDebouncedValue from '@app/hooks/helpers/useDebounce';

export const Swap = () => {
    const [signMessageModalOpen, setSignMessageModalOpen] = useState(false);
    const dataAcc = useAccount();
    const { data: accountBalance } = useBalance({ address: dataAcc.address });
    const activeChainIcon = useMemo(() => {
        if (!accountBalance?.symbol) return null;
        return getIcon({
            simbol: accountBalance?.symbol,
            width: 10,
        });
    }, [accountBalance?.symbol]);

    const handleConfirm = () => {
        setSignMessageModalOpen(true);
        signMessageAsync({ message: 'Hello sign this test message' })
            .then(() => setWalletConnectModalStep(SwapStep.Progress))
            .catch(() => {
                addToast({
                    title: 'Error',
                    text: 'Something went wrong',
                    type: 'error',
                });
                setWalletConnectModalStep(SwapStep.ConnectWallet);
            });
    };

    const addToast = useToastStore((s) => s.addToast);
    const { signMessageAsync } = useSignMessage();

    const [amount, setAmount] = useState<string>('');
    const [targetAmount, setTargetAmount] = useState<string>('');

    const ammoutDebounced = useDebouncedValue(amount, 500);
    const targetAmountDebounced = useDebouncedValue(targetAmount, 500);

    const { direction, setDirection, getTradeDetails } = useSwap();
    useEffect(() => {
        const tradeDetails = getTradeDetails('1000000000000000000');
        tradeDetails.then((details) => {
            const { trade, route } = details;
            if (!trade || !route) {
                console.error('Could not calculate trade route.');
                return;
            }
            const midPrice = route.midPrice.toSignificant(6);
            const invertedMidPrice = route.midPrice.invert().toSignificant(6);
            const executionPrice = trade.executionPrice.toSignificant(6);
            console.log('details', details);
            console.log('midPrice', midPrice);
            console.log('invertedMidPrice', invertedMidPrice);
            console.log('executionPrice', executionPrice);
        });
    }, [ammoutDebounced, targetAmountDebounced]);

    const handleNumberInput = (value: string, setter: (value: string) => void) => {
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
    };

    const items = [
        {
            label: 'Network fee',
            value: '$0.06',
            valueRight: 'Fees 0.02%',
            helpText: 'Fees 0.02%',
        },
        {
            label: 'Network Cost',
            value: '0x12345..12789',
            helpText: 'Fees 0.02%',
        },
        {
            label: 'You will receive XTM in (Tari wallet address)',
            value: 'FA12345..12789',
            helpText: 'You will receive XTM in (Tari wallet address)',
        },
        {
            label: 'Slippage',
            value: '0.50%',
            helpText: 'You will receive XTM in (Tari wallet address)',
        },
        {
            label: 'Price Impact',
            value: '0.08%',
            helpText: 'You will receive XTM in (Tari wallet address)',
        },
    ];

    if (signMessageModalOpen) {
        return <SignMessage />;
    }

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
                        inputMode="decimal"
                        placeholder="0.00"
                        onChange={(e) => handleNumberInput(e.target.value, setAmount)}
                        onBlur={() => setAmount((amount) => Number(amount).toString())}
                        value={amount}
                    />
                    <SwapOptionCurrency>
                        {getIcon({ simbol: accountBalance?.symbol || '', width: 10 })}
                        <span>{accountBalance?.symbol}</span>
                    </SwapOptionCurrency>
                </SwapOptionAmount>
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
                        onChange={(e) => handleNumberInput(e.target.value, setTargetAmount)}
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
