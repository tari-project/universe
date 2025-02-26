import { memo, useState } from 'react';
import Sidebar from '@app/containers/main/SidebarNavigation/Sidebar.tsx';
import OpenSettingsButton from '@app/containers/floating/Settings/components/OpenSettingsButton.tsx';
import { SidebarWrapper, MinimizedWrapper } from './SidebarNavigation.styles.ts';
import { TariSvg } from '@app/assets/icons/tari.tsx';

const SidebarNavigation = memo(function SidebarNavigation() {
    const [expanded, _setExpanded] = useState(true);
    // no minimize for now
    // function handleClick() {
    //     setExpanded((c) => !c);
    // }
    const minimisedContent = (
        <MinimizedWrapper>
            <TariSvg />
            <OpenSettingsButton />
        </MinimizedWrapper>
    );
    return (
        <SidebarWrapper style={{ width: expanded ? 348 : 92 }} transition={{ duration: 2, ease: 'easeIn' }}>
            {expanded ? <Sidebar /> : minimisedContent}
        </SidebarWrapper>
    );
});

export default SidebarNavigation;
