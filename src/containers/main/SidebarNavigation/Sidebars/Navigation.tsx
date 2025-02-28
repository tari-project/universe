import { memo, ReactNode } from 'react';
import { IoChevronForwardOutline } from 'react-icons/io5';
import { setAnimationProperties } from '@app/visuals.ts';

import { useUIStore } from '@app/store/useUIStore.ts';
import { WalletOutlineSVG } from '@app/assets/icons/wallet-outline.tsx';
import { CubeOutlineSVG } from '@app/assets/icons/cube-outline.tsx';
import { SB_MINI_WIDTH, SB_SPACING, SB_WIDTH } from '@app/theme/styles.ts';
import { HoverIconWrapper, NavIconWrapper, NavigationWrapper, StyledIconButton } from './SidebarMini.styles.ts';

interface NavButtonProps {
    children: ReactNode;
    isActive?: boolean;
    onClick?: () => void;
}
function NavButton({ children, isActive, onClick }: NavButtonProps) {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const rotate = sidebarOpen ? '180deg' : '0deg';
    const activeIcon = isActive ? (
        <>
            <HoverIconWrapper
                whileHover={{ opacity: 1 }}
                animate={{ rotate, transition }}
                style={{
                    opacity: 0,
                    rotate,
                }}
            >
                <IoChevronForwardOutline size={28} />
            </HoverIconWrapper>
        </>
    ) : null;
    return (
        <StyledIconButton variant="secondary" active={isActive} onClick={onClick}>
            {activeIcon}
            <NavIconWrapper>{children}</NavIconWrapper>
        </StyledIconButton>
    );
}

const transition = { rotate: { type: 'spring' }, opacity: { delay: 0.05 } };
const Navigation = memo(function Navigation() {
    const { setSidebarOpen, sidebarOpen, setView, view } = useUIStore((s) => ({
        setSidebarOpen: s.setSidebarOpen,
        sidebarOpen: s.sidebarOpen,
        setView: s.setView,
        view: s.view,
    }));
    const miningActive = view === 'mining';

    function handleActiveSidebar() {
        setSidebarOpen(!sidebarOpen);
        const offset = ((sidebarOpen ? SB_MINI_WIDTH : SB_WIDTH) + SB_SPACING) / window.innerWidth;
        setAnimationProperties([{ property: 'cameraOffsetX', value: offset }]);
    }

    function handleMiningClick() {
        if (!miningActive) {
            setView('mining');
        } else {
            handleActiveSidebar();
        }
    }
    function handleWalletClick() {
        if (miningActive) {
            setView('wallet');
        } else {
            handleActiveSidebar();
        }
    }

    const miningSection = (
        <NavButton onClick={handleMiningClick} isActive={miningActive}>
            <CubeOutlineSVG />
        </NavButton>
    );
    const walletSection = (
        <NavButton onClick={handleWalletClick} isActive={!miningActive}>
            <WalletOutlineSVG />
        </NavButton>
    );
    return (
        <NavigationWrapper>
            {miningSection}
            {walletSection}
        </NavigationWrapper>
    );
});

export default Navigation;
