import L2WalletCard from '@app/components/wallet-l2/L2WalletCard.tsx';
import { SidebarContent, SidebarWrapper } from './Sidebar.styles.ts';

const variants = {
    hidden: { opacity: 0, left: -10 },
    visible: { opacity: 1, left: 0 },
};

export default function SidebarL2() {
    return (
        <SidebarWrapper variants={variants} initial="hidden" animate="visible" exit="hidden" data-testid="sidebar-l2">
            <SidebarContent>
                {/* Top half stays empty for now. */}
                <div style={{ flex: '1 1 100%' }} />
                <L2WalletCard />
            </SidebarContent>
        </SidebarWrapper>
    );
}
