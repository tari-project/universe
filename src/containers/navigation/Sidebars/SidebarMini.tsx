import { memo } from 'react';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';
import OpenSettingsButton from '@app/containers/floating/Settings/components/OpenSettingsButton.tsx';
import { AirdropSidebarItems } from '@app/containers/main/Airdrop/sidebar/AirdropSidebarItems.tsx';
import { GridBottom, GridCenter, GridTop, LogoWrapper, MiniWrapper } from './SidebarMini.styles.ts';
import { useConfigUIStore } from '@app/store';
import { WalletUIMode } from '@app/types/events-payloads.ts';
import MineButton from './buttons/MineButton.tsx';
import BridgeButton from './buttons/BridgeButton.tsx';
import FailedModuleButton from '@app/containers/navigation/Sidebars/buttons/FailedModuleButton.tsx';

const SidebarMini = memo(function SidebarMini() {
    const isStandardWalletUI = useConfigUIStore((s) => s.wallet_ui_mode === WalletUIMode.Standard);

    return (
        <MiniWrapper>
            <GridTop>
                <LogoWrapper>
                    <TariOutlineSVG />
                </LogoWrapper>
            </GridTop>
            <GridCenter>
                <MineButton />
                <FailedModuleButton />
                {isStandardWalletUI && <BridgeButton />}
            </GridCenter>
            <GridBottom>
                <AirdropSidebarItems />
                <OpenSettingsButton iconSize={22} size="large" />
            </GridBottom>
        </MiniWrapper>
    );
});

export default SidebarMini;
