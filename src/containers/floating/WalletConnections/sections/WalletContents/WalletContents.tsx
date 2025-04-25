import { ContentWrapper, WalletAddress } from '../../WalletConnections.style';
import { useDisconnect } from '@reown/appkit/react';
import MMFox from '../../icons/mm-fox';
import { useAccount, useBalance } from 'wagmi';
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
import { getIcon } from '../../helpers/getIcon';

export const WalletContents = () => {
    const { disconnect } = useDisconnect();
    const dataAcc = useAccount();

    const { data: accountBalance } = useBalance({ address: dataAcc.address });

    const walletChainIcon = useMemo(() => {
        if (!accountBalance?.symbol) return null;
        const icon = getIcon({
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

    return (
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
                        {accountBalance?.value.toString() || 0} {accountBalance?.symbol}
                    </WalletValueRight>
                </WalletValue>
            </ContentWrapper>

            <WalletButton variant="secondary" onClick={() => setWalletConnectModalStep(SwapStep.Swap)} size="large">
                {'Continue'}
            </WalletButton>
        </WalletContentsContainer>
    );
};
