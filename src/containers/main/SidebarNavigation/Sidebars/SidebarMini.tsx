import { memo, useState } from 'react';

import OpenSettingsButton from '@app/containers/floating/Settings/components/OpenSettingsButton.tsx';
import { CubeOutlineSVG } from '@app/assets/icons/cube-outline.tsx';
import { WalletOutlineSVG } from '@app/assets/icons/wallet-outline.tsx';
import { CTAWrapper, LogoWwrapper, MinimizedWrapper } from './SidebarMini.styles.ts';
import { SidebarWrapper } from '@app/containers/main/SidebarNavigation/SidebarNavigation.styles.ts';
import { SB_MINI_WIDTH, SB_SPACING, SB_WIDTH } from '@app/theme/styles.ts';
import { useUIStore } from '@app/store/useUIStore.ts';
import { setAnimationProperties } from '@app/visuals.ts';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';

const SidebarMini = memo(function SidebarMini() {
    const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const [activesection, setActiveSection] = useState<'main' | 'wallet'>('main');

    function handleMiningClick() {
        if (activesection !== 'main') {
            setActiveSection('main');
        } else {
            setSidebarOpen(!sidebarOpen);
            const offset = ((sidebarOpen ? SB_MINI_WIDTH : SB_WIDTH) + SB_SPACING) / window.innerWidth;
            setAnimationProperties([{ property: 'cameraOffsetX', value: offset }]);
        }
    }
    return (
        <SidebarWrapper style={{ width: SB_MINI_WIDTH }}>
            <MinimizedWrapper>
                <LogoWwrapper>
                    <TariOutlineSVG />
                </LogoWwrapper>
                <CTAWrapper>
                    <IconButton variant="secondary" active={activesection === 'main'} onClick={handleMiningClick}>
                        <CubeOutlineSVG />
                    </IconButton>
                    <IconButton
                        variant="secondary"
                        active={activesection === 'wallet'}
                        onClick={() => setActiveSection('wallet')}
                    >
                        <WalletOutlineSVG />
                    </IconButton>
                </CTAWrapper>
                <OpenSettingsButton iconSize={22} size="large" />
            </MinimizedWrapper>
        </SidebarWrapper>
    );
});

export default SidebarMini;
