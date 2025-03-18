import { memo, ReactNode, useCallback, useEffect } from 'react';
import { IoChevronForwardOutline } from 'react-icons/io5';
import { setAnimationProperties } from '@tari-project/tari-tower';

import { SidebarType, useUIStore } from '@app/store/useUIStore.ts';
import { setCurrentSidebar, setSidebarOpen } from '@app/store/actions/uiStoreActions';

import { CubeOutlineSVG } from '@app/assets/icons/cube-outline.tsx';
import { SB_MINI_WIDTH, SB_SPACING, SB_WIDTH } from '@app/theme/styles.ts';
import { HoverIconWrapper, NavIconWrapper, NavigationWrapper, StyledIconButton } from './SidebarMini.styles.ts';

interface NavButtonProps {
    children: ReactNode;
    isActive?: boolean;
    onClick?: () => void;
}

const transition = { rotate: { type: 'spring' }, opacity: { delay: 0.05 } };

const NavButton = memo(function NavButton({ children, isActive, onClick }: NavButtonProps) {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const rotate = sidebarOpen ? '180deg' : '0deg';
    const showArrow = sidebarOpen ? isActive : true;
    const expandIcon = showArrow ? (
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
        <StyledIconButton
            onClick={onClick}
            active={isActive}
            aria-pressed={isActive}
            aria-label={isActive ? 'Active sidebar section' : 'Inactive sidebar section'}
        >
            {expandIcon}
            <NavIconWrapper>{children}</NavIconWrapper>
        </StyledIconButton>
    );
});
const Navigation = memo(function Navigation() {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const currentSidebar = useUIStore((s) => s.currentSidebar);

    const miningActive = currentSidebar === 'mining';

    const handleActiveSidebar = useCallback(
        (sidebarType: SidebarType) => {
            if (currentSidebar === sidebarType) {
                setSidebarOpen(!sidebarOpen);
            } else {
                setCurrentSidebar(sidebarType);
                if (!sidebarOpen) {
                    setSidebarOpen(true);
                }
            }
        },
        [currentSidebar, sidebarOpen]
    );

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

    const miningSection = (
        <NavButton onClick={() => handleActiveSidebar('mining')} isActive={miningActive}>
            <CubeOutlineSVG />
        </NavButton>
    );
    return <NavigationWrapper>{miningSection}</NavigationWrapper>;
});

export default Navigation;
