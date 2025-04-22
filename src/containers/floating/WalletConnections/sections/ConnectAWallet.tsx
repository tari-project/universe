import { ContentWrapper, WalletAddress, WalletConnectHeader } from '../WalletConnections.style';
import { Divider } from '@app/components/elements/Divider';
import { useAppKitAccount, useDisconnect } from '@reown/appkit/react';
import { useAppKitWallet } from '@reown/appkit-wallet-button/react';
import MMFox from '../icons/mm-fox';
import Phantom from '../icons/phantom.png';
import Portal from '../icons/portal.png';

export const ConnectAWallet = () => {
    const { allAccounts } = useAppKitAccount({ namespace: 'eip155' });
    const { disconnect } = useDisconnect();
    const { connect } = useAppKitWallet({
        onSuccess() {
            // ...
        },
        onError(error) {
            // ...
        },
    });
    return (
        <>
            <WalletConnectHeader>{'Connect a Wallet'}</WalletConnectHeader>
            <ContentWrapper>
                <button onClick={() => connect('portal')}>
                    <img src={Portal} alt="Portal" width="40" />
                    <span>{'Portal Wallet'}</span>
                </button>
                <Divider />
                <button onClick={() => connect('metamask')}>
                    <MMFox width="25" />
                    <span>{'Metamask'}</span>
                </button>
                <Divider />
                <button onClick={() => connect('phantom')}>
                    <img src={Phantom} alt="Phantom" />
                    <span>{'Phantom'}</span>
                </button>
            </ContentWrapper>
        </>
    );
};
