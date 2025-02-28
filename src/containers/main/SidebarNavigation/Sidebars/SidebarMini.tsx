import { memo } from 'react';
import { SB_MINI_WIDTH } from '@app/theme/styles.ts';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';
import { SidebarWrapper } from '../SidebarNavigation.styles.ts';
import { LogoWrapper, MinimizedWrapper } from './SidebarMini.styles.ts';
import OpenSettingsButton from '@app/containers/floating/Settings/components/OpenSettingsButton.tsx';
import Navigation from './Navigation.tsx';

const SidebarMini = memo(function SidebarMini() {
    return (
        <SidebarWrapper style={{ width: SB_MINI_WIDTH }}>
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
