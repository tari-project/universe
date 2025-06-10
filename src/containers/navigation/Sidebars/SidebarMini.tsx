import { memo } from 'react';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';
import OpenSettingsButton from '@app/containers/floating/Settings/components/OpenSettingsButton.tsx';
import { AirdropSidebarItems } from '@app/containers/main/Airdrop/sidebar/AirdropSidebarItems.tsx';
import NavigationButton from './NavigationButton';
import { GridBottom, GridCenter, GridTop, LogoWrapper, MiniWrapper } from './SidebarMini.styles.ts';
import BridgeNavigationButton from './BridgeNavigationButton.tsx';
import { useTappletsStore } from '@app/store/useTappletsStore.ts';
import { useUIStore } from '@app/store';

const SidebarMini = memo(function SidebarMini() {
    const { uiBridgeSwapsEnabled } = useTappletsStore();
    const { seedlessUI } = useUIStore();
    return (
        <MiniWrapper>
            <GridTop>
                <LogoWrapper>
                    <TariOutlineSVG />
                </LogoWrapper>
            </GridTop>
            <GridCenter>
                <NavigationButton />
                {uiBridgeSwapsEnabled && !seedlessUI && <BridgeNavigationButton />}
            </GridCenter>
            <GridBottom>
                <AirdropSidebarItems />
                <OpenSettingsButton iconSize={22} size="large" />
            </GridBottom>
        </MiniWrapper>
    );
});

export default SidebarMini;
