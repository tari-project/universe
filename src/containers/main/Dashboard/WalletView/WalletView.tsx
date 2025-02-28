import { memo } from 'react';
import { WalletViewContainer } from '@app/containers/main/Dashboard/WalletView/WalletView.styles.ts';
import { Balance } from '@app/components/transactions/earnings/Balance.tsx';

const WalletView = memo(function WalletView() {
    return (
        <WalletViewContainer>
            <Balance />

            <div style={{ textAlign: 'center', fontSize: 140 }}>{`👻`}</div>
        </WalletViewContainer>
    );
});

export default WalletView;
