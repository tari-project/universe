import { AnimatedBG, DetailsCard, DetailsCardContent, WalletWrapper } from './styles.ts';
import WalletBalance from '../components/balance/WalletBalance.tsx';
import WalletDetails from '@app/components/wallet/components/details/WalletDetails.tsx';

export default function SidebarWallet() {
    return (
        <WalletWrapper>
            <DetailsCard>
                <AnimatedBG $col1={`#0B0A0D`} $col2={`#7C8D10`} />
                <DetailsCardContent>
                    <WalletDetails />
                    <WalletBalance />
                </DetailsCardContent>
            </DetailsCard>
        </WalletWrapper>
    );
}
