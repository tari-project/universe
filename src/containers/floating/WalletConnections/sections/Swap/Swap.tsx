import { WalletConnectHeader } from '../../WalletConnections.style';
import { WalletButton } from '../../components/WalletButton/WalletButton';
import { setWalletConnectModalStep } from '@app/store/actions/walletStoreActions';
import { SwapStep } from '@app/store';
import {
    NewOutputAmount,
    NewOutputWrapper,
    SelectedChain,
    SelectedChainInfo,
    SwapDetails,
    SwapDetailsItemWrapper,
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
import { useMemo } from 'react';
import { ArrowIcon } from '../../icons/elements/ArrowIcon';
import { QuestionMarkIcon } from '../../icons/elements/QuestionMarkIcon';

export const Swap = () => {
    const dataAcc = useAccount();
    const { data: accountBalance } = useBalance({ address: dataAcc.address });
    const activeChainIcon = useMemo(() => {
        if (!accountBalance?.symbol) return null;
        return getIcon({
            simbol: accountBalance?.symbol,
            width: 10,
        });
    }, [accountBalance?.symbol]);

    const items = [
        {
            key: 'Network fee',
            value: '$0.06',
            valueRightSide: 'Fees 0.02%',
            helpData: 'Fees 0.02%',
        },
        {
            key: 'Network Cost',
            value: '0x12345..12789',
            helpData: 'Fees 0.02%',
        },
        {
            key: 'You will receive XTM in (Tari wallet address)',
            value: 'FA12345..12789',
            helpData: 'You will receive XTM in (Tari wallet address)',
        },
        {
            key: 'Slippage',
            value: '0.50%',
            helpData: 'You will receive XTM in (Tari wallet address)',
        },
        {
            key: 'Price Impact',
            value: '0.08%',
            helpData: 'You will receive XTM in (Tari wallet address)',
        },
    ];

    return (
        <>
            <WalletConnectHeader>
                <span>{'Review'}</span>
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
                    <span className="amount">{'0.00'}</span>
                    <SwapOptionCurrency>
                        {getIcon({ simbol: accountBalance?.symbol || '', width: 10 })}
                        <span>{accountBalance?.symbol}</span>
                    </SwapOptionCurrency>
                </SwapOptionAmount>
            </SwapOption>
            <SwapDirection>
                <SwapDirectionWrapper>
                    <ArrowIcon width={15} />
                </SwapDirectionWrapper>
            </SwapDirection>
            <SwapOption>
                <span> {'Receive'} </span>
                <SwapOptionAmount>
                    <span className="amount">{'0.00'}</span>
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

                {items.map((item, index) => (
                    <SwapDetailsItemWrapper key={`${item.key}-${index}`}>
                        <SwapDetailsKey>
                            {item.key} {item.helpData && <QuestionMarkIcon width={15} />}
                        </SwapDetailsKey>
                        <SwapDetailsValue>
                            <div>{item.value}</div> <span>{item.valueRightSide}</span>
                        </SwapDetailsValue>
                    </SwapDetailsItemWrapper>
                ))}
            </SwapDetails>

            <WalletButton
                variant="primary"
                onClick={() => setWalletConnectModalStep(SwapStep.WalletContents)}
                size="large"
            >
                {'Approve & Buy'}
            </WalletButton>
        </>
    );
};
