import { memo } from 'react';
import { WalletViewContainer } from '@app/containers/main/Dashboard/WalletView/WalletView.styles.ts';

const WalletView = memo(function WalletView() {
    return (
        <WalletViewContainer>
            <h1>{`👻`}</h1>
        </WalletViewContainer>
    );
});

export default WalletView;
