import MiningSection from './sections/Mining.tsx';
import WalletSidebarContent from '@app/components/transactions/WalletSidebarContent.tsx';
import { SidebarContent, SidebarWrapper } from './Sidebar.styles.ts';

const variants = {
    hidden: { opacity: 0, left: -10 },
    visible: { opacity: 1, left: 0 },
};
export default function Sidebar() {
    return (
        <SidebarWrapper variants={variants} initial="hidden" animate="visible" exit="hidden">
            <SidebarContent>
                <MiningSection />
                <WalletSidebarContent />
            </SidebarContent>
        </SidebarWrapper>
    );
}
