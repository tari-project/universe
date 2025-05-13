import { ContentWrapper, WalletAddress } from '../../WalletConnections.style';
import MMFox from '../../icons/mm-fox';
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { WalletButton } from '../../components/WalletButton/WalletButton';
import {
    ActiveDot,
    ConnectedWalletWrapper,
    StatusWrapper,
    WalletContentsContainer,
    WalletValue,
    WalletValueLeft,
    WalletValueRight,
} from './WalletContents.styles';
import { truncateMiddle } from '@app/utils/truncateString.ts';
import { useMemo } from 'react';
import { setWalletConnectModalStep } from '@app/store/actions/walletStoreActions';
import { SwapStep } from '@app/store';
import { getCurrencyIcon } from '../../helpers/getIcon';
import TransactionModal from '@app/components/TransactionModal/TransactionModal';
import { AnimatePresence } from 'motion/react';

interface Props {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export const WalletContents = ({ isOpen, setIsOpen }: Props) => {
    const { disconnect } = useDisconnect();
    const dataAcc = useAccount();

    const { data: accountBalance } = useBalance({ address: dataAcc.address });

    const walletChainIcon = useMemo(() => {
        if (!accountBalance?.symbol) return null;
        const icon = getCurrencyIcon({
            simbol: accountBalance?.symbol,
            width: 20,
        });
        switch (accountBalance?.symbol.toLowerCase()) {
            case 'eth':
                return (
                    <WalletValueLeft>
                        {icon}
                        <span>{'Ethereum'}</span>
                    </WalletValueLeft>
                );

            case 'pol':
                return (
                    <WalletValueLeft>
                        {icon}
                        <span>{'Polygon'}</span>
                    </WalletValueLeft>
                );
            default:
                return null;
        }
    }, [accountBalance?.symbol]);

    const value = useMemo(() => {
        if (!accountBalance?.value) return 0;
        const factor = 10n ** BigInt(accountBalance.decimals);
        return (Number(accountBalance.value) / Number(factor)).toString();
    }, [accountBalance]);

    return (
        <TransactionModal show={isOpen} handleClose={() => setIsOpen(false)} title={'Connected wallet'}>
            <AnimatePresence mode="wait">
                <WalletContentsContainer>
                    <ConnectedWalletWrapper>
                        <WalletButton variant="error" onClick={() => disconnect()}>
                            {'Disconnect'}
                        </WalletButton>
                        <StatusWrapper>
                            <ActiveDot />
                            <MMFox width="25" />
                            <WalletAddress>{truncateMiddle(dataAcc.address || '', 4)}</WalletAddress>
                        </StatusWrapper>
                    </ConnectedWalletWrapper>
                    <ContentWrapper>
                        <WalletValue>
                            {walletChainIcon}
                            <WalletValueRight>
                                {value} {accountBalance?.symbol}
                            </WalletValueRight>
                        </WalletValue>
                    </ContentWrapper>
                </WalletContentsContainer>
            </AnimatePresence>
        </TransactionModal>
    );
};
