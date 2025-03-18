import { memo, ReactNode, useEffect } from 'react';
import { IoChevronForwardOutline } from 'react-icons/io5';
import { setAnimationProperties } from '@tari-project/tari-tower';

import { useUIStore } from '@app/store/useUIStore.ts';
import { setSidebarOpen } from '@app/store/actions/uiStoreActions';

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
            <NavButton onClick={handleToggleOpen} isActive={true}>
                <CubeOutlineSVG />
            </NavButton>
        </NavigationWrapper>
    );
});

export default NavigationButton;
