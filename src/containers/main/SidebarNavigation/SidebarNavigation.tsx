import { memo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import Sidebar from '@app/containers/main/SidebarNavigation/Sidebar.tsx';
import OpenSettingsButton from '@app/containers/floating/Settings/components/OpenSettingsButton.tsx';
import { SidebarWrapper, MinimizedWrapper, SidebarCover } from './SidebarNavigation.styles.ts';
import { TariSvg } from '@app/assets/icons/tari.tsx';
import { setShowWalletHistory, useUIStore } from '@app/store/useUIStore.ts';

const SidebarNavigation = memo(function SidebarNavigation() {
    const showSidebarCover = useUIStore((s) => s.showSidebarCover);
    const [expanded, _setExpanded] = useState(true);
    // no minimize for now
    // function handleClick() {
    //     setExpanded((c) => !c);
    // }
    function handleCoverClick() {
        setShowWalletHistory(false);
    }
    const minimisedContent = (
        <MinimizedWrapper>
            <TariSvg />
            <OpenSettingsButton iconSize={24} />
        </MinimizedWrapper>
    );
    return (
        <SidebarWrapper style={{ width: expanded ? 348 : 92 }} transition={{ duration: 2, ease: 'easeIn' }}>
            {expanded ? <Sidebar /> : minimisedContent}
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
