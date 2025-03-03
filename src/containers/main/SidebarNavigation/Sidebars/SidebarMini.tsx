import { memo } from 'react';

import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';
import { SidebarWrapper } from '../SidebarNavigation.styles.ts';
import { LogoWrapper, MinimizedWrapper } from './SidebarMini.styles.ts';
import OpenSettingsButton from '@app/containers/floating/Settings/components/OpenSettingsButton.tsx';
import Navigation from './Navigation.tsx';

const SidebarMini = memo(function SidebarMini() {
    return (
        <SidebarWrapper $isMiniBar>
            <MinimizedWrapper>
                <LogoWrapper>
                    <TariOutlineSVG />
                </LogoWrapper>
                <Navigation />
                <OpenSettingsButton iconSize={22} size="large" />
            </MinimizedWrapper>
        </SidebarWrapper>
    );
});

export default SidebarMini;
