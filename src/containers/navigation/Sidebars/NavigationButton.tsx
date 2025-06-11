import { memo, ReactNode, useEffect, useState } from 'react';
import { IoChevronForwardOutline } from 'react-icons/io5';
import { setAnimationProperties } from '@tari-project/tari-tower';

import { useUIStore } from '@app/store/useUIStore.ts';
import { setShowTapplet, setSidebarOpen } from '@app/store/actions/uiStoreActions';

import { CubeOutlineSVG } from '@app/assets/icons/cube-outline.tsx';
import {
    ConnectionWrapper,
    HoverIconWrapper,
    NavIconWrapper,
    NavigationWrapper,
    StyledIconButton,
} from './SidebarMini.styles.ts';
import ConnectedPulse from '@app/containers/navigation/components/VersionChip/ConnectedPulse/ConnectedPulse.tsx';
import { AnimatePresence } from 'motion/react';

interface NavButtonProps {
    children: ReactNode;
    isActive?: boolean;
    onClick?: () => void;
}

export const NavButton = memo(function NavButton({ children, isActive, onClick }: NavButtonProps) {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const [showArrow, setShowArrow] = useState(false);

    const scaleX = sidebarOpen ? -1 : 1;

    return (
        <StyledIconButton
            onClick={onClick}
            active={isActive}
            aria-pressed={isActive}
            aria-label={isActive ? 'Active sidebar section' : 'Inactive sidebar section'}
            onMouseEnter={() => setShowArrow(true)}
            onMouseLeave={() => setShowArrow(false)}
        >
            <AnimatePresence mode="popLayout">
                {showArrow ? (
                    <HoverIconWrapper
                        key="hover"
                        initial={{ opacity: 0, scaleX }}
                        exit={{ opacity: 0, scaleX }}
                        animate={{ opacity: 1, scaleX }}
                    >
                        <IoChevronForwardOutline size={28} />
                    </HoverIconWrapper>
                ) : (
                    <NavIconWrapper
                        key="not-hover"
                        initial={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {children}
                    </NavIconWrapper>
                )}
            </AnimatePresence>
        </StyledIconButton>
    );
});
const NavigationButton = memo(function NavigationButton() {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const towerSidebarOffset = useUIStore((s) => s.towerSidebarOffset);
    const showTapplet = useUIStore((s) => s.showTapplet);

    function handleToggleOpen() {
        if (showTapplet) {
            setSidebarOpen(true);
            setShowTapplet(false);
        } else {
            setSidebarOpen(!sidebarOpen);
        }
    }

    useEffect(() => {
        setAnimationProperties([
            { property: 'offsetX', value: towerSidebarOffset },
            { property: 'cameraOffsetX', value: towerSidebarOffset / window.innerWidth },
        ]);
    }, [towerSidebarOffset]);

    return (
        <NavigationWrapper>
            <ConnectionWrapper>
                <ConnectedPulse />
            </ConnectionWrapper>
            <NavButton onClick={handleToggleOpen} isActive={true}>
                <CubeOutlineSVG />
            </NavButton>
        </NavigationWrapper>
    );
});

export default NavigationButton;
