import { WalletWrapper } from './styles.ts';
import WalletBalance from '../components/balance/WalletBalance.tsx';

export default function SidebarWallet() {
    return (
        <WalletWrapper>
            <WalletBalance />
        </WalletWrapper>
    );
}
