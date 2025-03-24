import { WalletSidebarContent } from '@app/components/transactions';
import { WalletSectionWrapper } from './section.style.ts';

export default function WalletSection() {
    return (
        <WalletSectionWrapper>
            <WalletSidebarContent />
        </WalletSectionWrapper>
    );
}
