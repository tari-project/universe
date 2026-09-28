import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';
import OpenSettingsButton from '@app/containers/floating/Settings/components/OpenSettingsButton.tsx';
import { AirdropSidebarItems } from '@app/containers/main/Airdrop/sidebar/AirdropSidebarItems.tsx';
import { GridBottom, GridCenter, GridTop, LogoWrapper, MiniWrapper } from './SidebarMini.styles.ts';
import { useConfigUIStore, useMiningStore } from '@app/store';
import { networkSupportsL2 } from '@app/utils/network';
import { WalletUIMode } from '@app/types/events-payloads.ts';
import MineButton from './buttons/MineButton.tsx';
import BridgeButton from './buttons/BridgeButton.tsx';
import L2Button from './buttons/L2Button.tsx';
import FailedModuleButton from '@app/containers/navigation/Sidebars/buttons/FailedModuleButton.tsx';

export default function SidebarMini() {
    const isStandardWalletUI = useConfigUIStore((s) => s.wallet_ui_mode === WalletUIMode.Standard);
    const showL2 = useMiningStore((s) => networkSupportsL2(s.network));

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
                {showL2 && <L2Button />}
            </GridCenter>
            <GridBottom>
                <AirdropSidebarItems />
                <OpenSettingsButton iconSize={22} size="large" />
            </GridBottom>
        </MiniWrapper>
    );
}
