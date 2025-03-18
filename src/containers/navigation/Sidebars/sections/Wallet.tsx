import WalletBalanceMarkup from '../../components/Wallet/WalletBalanceMarkup.tsx';
import { WalletSidebarContent } from '@app/components/transactions';
import { WalletSectionWrapper } from './section.style.ts';

export default function WalletSection() {
    return (
        <WalletSectionWrapper>
            <WalletBalanceMarkup />
            <WalletSidebarContent />
        </WalletSectionWrapper>
    );
}
