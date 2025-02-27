import { memo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { setAnimationProperties } from '@app/visuals.ts';
import { setShowWalletHistory, useUIStore } from '@app/store/useUIStore.ts';
import Sidebar from './Sidebars/Sidebar.tsx';
import SidebarMini from './Sidebars/SidebarMini.tsx';
import { SidebarWrapper, SidebarCover } from './SidebarNavigation.styles.ts';
import { SB_MINI_WIDTH, SB_SPACING, SB_WIDTH } from '@app/theme/styles.ts';

const SidebarNavigation = memo(function SidebarNavigation() {
    const showSidebarCover = useUIStore((s) => s.showSidebarCover);
    const [expanded, setExpanded] = useState(true);

    const offset = ((expanded ? SB_MINI_WIDTH : SB_WIDTH) + SB_SPACING) / window.innerWidth;
    function handleClick() {
        setAnimationProperties([{ property: 'cameraOffsetX', value: offset }]);
        setExpanded((c) => !c);
    }
    function handleCoverClick() {
        setShowWalletHistory(false);
    }

    return (
        <SidebarWrapper
            style={{ width: expanded ? SB_WIDTH : SB_MINI_WIDTH }}
            transition={{ duration: 2, ease: 'easeIn' }}
            onClick={handleClick}
        >
            {expanded ? <Sidebar /> : <SidebarMini />}
            <AnimatePresence>
                {showSidebarCover ? (
                    <SidebarCover
                        onClick={handleCoverClick}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />
                ) : null}
            </AnimatePresence>
        </SidebarWrapper>
    );
});

export default SidebarNavigation;
