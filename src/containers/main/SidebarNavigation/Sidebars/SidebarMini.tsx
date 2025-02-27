import { memo, useState } from 'react';
import * as m from 'motion/react-m';

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
import { IoChevronForwardOutline } from 'react-icons/io5';

const SidebarMini = memo(function SidebarMini() {
    const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const setView = useUIStore((s) => s.setView);
    const view = useUIStore((s) => s.view);

    const miningActive = view === 'mining';

    const [minerHovered, setMinerHovered] = useState(false);

    function handleMiningClick() {
        if (!miningActive) {
            setView('mining');
        } else {
            setSidebarOpen(!sidebarOpen);
            const offset = ((sidebarOpen ? SB_MINI_WIDTH : SB_WIDTH) + SB_SPACING) / window.innerWidth;
            setAnimationProperties([{ property: 'cameraOffsetX', value: offset }]);
        }
    }
    const rotate = sidebarOpen ? '180deg' : '0deg';
    const minerIcon =
        minerHovered && miningActive ? (
            <m.div
                animate={{ rotate, transition: { type: 'spring' } }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', rotate }}
            >
                <IoChevronForwardOutline size={28} />
            </m.div>
        ) : (
            <CubeOutlineSVG />
        );
    return (
        <SidebarWrapper style={{ width: SB_MINI_WIDTH }}>
            <MinimizedWrapper>
                <LogoWwrapper>
                    <TariOutlineSVG />
                </LogoWwrapper>
                <CTAWrapper>
                    <IconButton
                        variant="secondary"
                        active={view === 'mining'}
                        onClick={handleMiningClick}
                        onMouseEnter={() => setMinerHovered(true)}
                        onMouseLeave={() => setMinerHovered(false)}
                    >
                        {minerIcon}
                    </IconButton>
                    <IconButton variant="secondary" active={view === 'wallet'} onClick={() => setView('wallet')}>
                        <WalletOutlineSVG />
                    </IconButton>
                </CTAWrapper>
                <OpenSettingsButton iconSize={22} size="large" />
            </MinimizedWrapper>
        </SidebarWrapper>
    );
});

export default SidebarMini;
