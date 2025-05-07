import { memo, ReactNode, useEffect, useState } from 'react';
import { IoChevronForwardOutline } from 'react-icons/io5';
import { setAnimationProperties } from '@tari-project/tari-tower';

import { useUIStore } from '@app/store/useUIStore.ts';
import { setShowTapplet, setSidebarOpen } from '@app/store/actions/uiStoreActions';

import { CubeOutlineSVG } from '@app/assets/icons/cube-outline.tsx';
import { SB_MINI_WIDTH, SB_SPACING, SB_WIDTH } from '@app/theme/styles.ts';
import { HoverIconWrapper, NavIconWrapper, NavigationWrapper, StyledIconButton } from './SidebarMini.styles.ts';
import { AnimatePresence } from 'motion/react';
import { useConfigUIStore } from '@app/store/useAppConfigStore.ts';
import { setVisualMode } from '@app/store/index.ts';
import { BridgeOutlineSVG } from '@app/assets/icons/bridge-outline.tsx';

interface NavButtonProps {
    children: ReactNode;
    isActive?: boolean;
    onClick?: () => void;
}

const NavButton = memo(function NavButton({ children, isActive, onClick }: NavButtonProps) {
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
    const visualMode = useConfigUIStore((s) => s.visual_mode);

    function handleToggleOpen() {
        setShowTapplet(!showTapplet);
        setVisualMode(!visualMode);
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
            <NavButton onClick={handleToggleOpen} isActive={true}>
                <BridgeOutlineSVG />
            </NavButton>
        </NavigationWrapper>
    );
});

export default BridgeNavigationButton;
