import { ConnectButton, ContentWrapper } from '../../WalletConnections.style';
import { Divider } from '@app/components/elements/Divider';
import { useAppKitWallet } from '@reown/appkit-wallet-button/react';
import MMFox from '../../icons/mm-fox';
import Phantom from '../../icons/phantom.png';
// import Portal from '../../icons/portal.png';

export const ConnectWallet = () => {
    const { connect } = useAppKitWallet({
        onSuccess(data) {
            console.log('onSuccess', data);
            // ...
        },
        onError(error) {
            // ...
        },
    });
    return (
        <ContentWrapper>
            {
                // <ConnectButton onClick={() => connect('portal')}>
                //     <img src={Portal} alt="Portal" width="40" />
                //     <span>{'Portal Wallet'}</span>
                // </ConnectButton>
            }
            <Divider />
            <ConnectButton onClick={() => connect('metamask')}>
                <MMFox width="25" />
                <span>{'Metamask'}</span>
            </ConnectButton>
            <Divider />
            <ConnectButton onClick={() => connect('phantom')}>
                <img src={Phantom} alt="Phantom" />
                <span>{'Phantom'}</span>
            </ConnectButton>
        </ContentWrapper>
    );
};
