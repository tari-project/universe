import { memo, ReactNode, useEffect, useState } from 'react';
import { IoChevronForwardOutline } from 'react-icons/io5';
import { setAnimationProperties } from '@tari-project/tari-tower';

import { useUIStore } from '@app/store/useUIStore.ts';
import { setShowTapplet, setSidebarOpen } from '@app/store/actions/uiStoreActions';

import { SB_MINI_WIDTH, SB_SPACING, SB_WIDTH } from '@app/theme/styles.ts';
import { HoverIconWrapper, NavIconWrapper, NavigationWrapper, StyledIconButton } from './SidebarMini.styles.ts';
import { AnimatePresence } from 'motion/react';

import { BridgeOutlineSVG } from '@app/assets/icons/bridge-outline.tsx';
import { useTappletsStore } from '@app/store/useTappletsStore.ts';
import { BRIDGE_TAPPLET_ID } from '@app/store/consts.ts';
import { useTariBalance } from '@app/hooks/wallet/useTariBalance.ts';

interface NavButtonProps {
    children: ReactNode;
    isActive?: boolean;
    onClick?: () => void;
}

const NavButton = memo(function NavButton({ children, isActive, onClick }: NavButtonProps) {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const [showArrow, setShowArrow] = useState(false);
    const { isWalletScanning } = useTariBalance();

    const scaleX = sidebarOpen ? -1 : 1;

    return (
        <StyledIconButton
            onClick={onClick}
            active={isActive}
            aria-pressed={isActive}
            aria-label={isActive ? 'Active sidebar section' : 'Inactive sidebar section'}
            onMouseEnter={() => setShowArrow(true)}
            onMouseLeave={() => setShowArrow(false)}
            disabled={isWalletScanning}
        >
            <AnimatePresence mode="popLayout">
                {showArrow ? (
                    <HoverIconWrapper
                        initial={{ opacity: 0, scaleX }}
                        exit={{ opacity: 0, scaleX }}
                        animate={{ opacity: 1, scaleX }}
                    >
                        <IoChevronForwardOutline size={28} />
                    </HoverIconWrapper>
                ) : (
                    <NavIconWrapper initial={{ opacity: 0 }} exit={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {children}
                    </NavIconWrapper>
                )}
            </AnimatePresence>
        </StyledIconButton>
    );
});
const BridgeNavigationButton = memo(function BridgeNavigationButton() {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const showTapplet = useUIStore((s) => s.showTapplet);
    const setActiveTappById = useTappletsStore((s) => s.setActiveTappById);

    function handleToggleOpen() {
        if (!showTapplet) {
            setActiveTappById(BRIDGE_TAPPLET_ID, true);
            setShowTapplet(true);
            setSidebarOpen(false);
        } else {
            setShowTapplet(false);
            setSidebarOpen(true);
        }
    }

    useEffect(() => {
        const offset = (!sidebarOpen ? SB_MINI_WIDTH : SB_WIDTH) + SB_SPACING * 2;
        setAnimationProperties([
            { property: 'offsetX', value: offset },
            { property: 'cameraOffsetX', value: offset / window.innerWidth },
        ]);

        return () => {
            setAnimationProperties([
                { property: 'offsetX', value: 0 },
                { property: 'cameraOffsetX', value: 0 },
            ]);
        };
    }, [sidebarOpen]);

    return (
        <NavigationWrapper>
            <NavButton onClick={handleToggleOpen} isActive>
                <BridgeOutlineSVG />
            </NavButton>
        </NavigationWrapper>
    );
});

export default BridgeNavigationButton;
