import { ContentWrapper, WalletAddress, WalletConnectHeader } from '../WalletConnections.style';
import { Divider } from '@app/components/elements/Divider';
import { useAppKitAccount, useDisconnect } from '@reown/appkit/react';
import { useAppKitWallet } from '@reown/appkit-wallet-button/react';
import MMFox from '../icons/mm-fox';
import Phantom from '../icons/phantom.png';
import Portal from '../icons/portal.png';

export const WalletContents = () => {
    const { allAccounts, embeddedWalletInfo } = useAppKitAccount({ namespace: 'eip155' });
    const { disconnect } = useDisconnect();
    const { connect } = useAppKitWallet({
        onSuccess() {
            // ...
        },
        onError(error) {
            // ...
        },
    });

    console.log('allAccounts', allAccounts, embeddedWalletInfo);
    return (
        <>
            {allAccounts.length === 0 ? (
                <WalletConnectHeader>{'Connect a Wallet'}</WalletConnectHeader>
            ) : (
                <>
                    <WalletConnectHeader>{'Connected Wallets'}</WalletConnectHeader>
                    <button onClick={() => disconnect({})}>{'Disconnect'}</button>
                    {allAccounts.map((account) => (
                        <WalletAddress key={account.address}>{account.address}</WalletAddress>
                    ))}
                </>
            )}
            <ContentWrapper>
                <button onClick={() => connect('phantom')}>
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
