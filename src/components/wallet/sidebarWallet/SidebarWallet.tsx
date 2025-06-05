import { AnimatedBG, DetailsCard, DetailsCardContent, WalletWrapper } from './styles.ts';
import WalletBalance from '../components/balance/WalletBalance.tsx';
import WalletDetails from '../components/details/WalletDetails.tsx';
import WalletHistory from '../components/history/WalletHistory.tsx';

export default function SidebarWallet() {
    return (
        <WalletWrapper>
            <DetailsCard>
                <AnimatedBG $col1={`#0B0A0D`} $col2={`#6F8309`} />
                <DetailsCardContent>
                    <WalletDetails />
                    <WalletBalance />
                </DetailsCardContent>
            </DetailsCard>
            <WalletHistory />
        </WalletWrapper>
    );
}
