import { memo } from 'react';

import OpenSettingsButton from '@app/containers/floating/Settings/components/OpenSettingsButton.tsx';
import { TariSvg } from '@app/assets/icons/tari.tsx';
import { CubeOutlineSVG } from '@app/assets/icons/cube-outline.tsx';
import { WalletOutlineSVG } from '@app/assets/icons/wallet-outline.tsx';
import { CTAWrapper, MinimizedWrapper } from './SidebarMini.styles.ts';

const SidebarMini = memo(function SidebarMini() {
    return (
        <MinimizedWrapper>
            <TariSvg />
            <CTAWrapper>
                <CubeOutlineSVG />
                <WalletOutlineSVG />
            </CTAWrapper>
            <OpenSettingsButton iconSize={24} />
        </MinimizedWrapper>
    );
});

export default SidebarMini;
