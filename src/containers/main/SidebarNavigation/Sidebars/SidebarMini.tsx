import { memo } from 'react';

import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';

import { GridBottom, GridCenter, GridTop, LogoWrapper, MiniWrapper } from './SidebarMini.styles.ts';
import OpenSettingsButton from '@app/containers/floating/Settings/components/OpenSettingsButton.tsx';
import Navigation from './Navigation.tsx';

const SidebarMini = memo(function SidebarMini() {
    return (
        <MiniWrapper>
            <GridTop>
                <LogoWrapper>
                    <TariOutlineSVG />
                </LogoWrapper>
            </GridTop>
            <GridCenter>
                <Navigation />
            </GridCenter>
            <GridBottom>
                <OpenSettingsButton iconSize={22} size="large" />
            </GridBottom>
        </MiniWrapper>
    );
});

export default SidebarMini;
