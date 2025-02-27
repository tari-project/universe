import { memo } from 'react';
import { WalletViewContainer } from '@app/containers/main/Dashboard/WalletView/WalletView.styles.ts';
import { Balance } from '@app/components/transactions/Balance.tsx';

const WalletView = memo(function WalletView() {
    return (
        <WalletViewContainer>
            <Balance />
        </WalletViewContainer>
    );
});

export default WalletView;
