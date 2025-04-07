import { memo, ReactNode, useEffect, useState } from 'react';
import { IoChevronForwardOutline } from 'react-icons/io5';
import { setAnimationProperties } from '@tari-project/tari-tower';

import { useUIStore } from '@app/store/useUIStore.ts';
import { setSidebarOpen } from '@app/store/actions/uiStoreActions';

import { CubeOutlineSVG } from '@app/assets/icons/cube-outline.tsx';
import { SB_MINI_WIDTH, SB_SPACING, SB_WIDTH } from '@app/theme/styles.ts';
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

const NavButton = memo(function NavButton({ children, isActive, onClick }: NavButtonProps) {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const [showArrow, setShowArrow] = useState(isActive);

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
const NavigationButton = memo(function NavigationButton() {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);

    function handleToggleOpen() {
        setSidebarOpen(!sidebarOpen);
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
