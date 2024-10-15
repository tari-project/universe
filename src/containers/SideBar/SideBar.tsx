import Miner from './Miner/Miner';
import Wallet from './components/Wallet/Wallet.tsx';
import Heading from './components/Heading';
import { Bottom, Scroll, SideBarContainer, SidebarTop, Top } from './styles';

import MiningButton from '@app/containers/Dashboard/MiningView/components/MiningButton.tsx';
import AirdropGiftTracker from '@app/containers/Airdrop/AirdropGiftTracker/AirdropGiftTracker';
import LostConnectionAlert from './components/LostConnectionAlert';
import { LowHashRateWarning } from './components/LowHashRateWarning/LowHashRateWarning.tsx';
import StagedSecurityModal from '../StagedSecurity/StagedSecurityModal.tsx';
import { useState } from 'react';

function SideBar() {
    const [open, setOpen] = useState(false);

    return (
        <SideBarContainer>
            <SidebarTop
                onClick={() => {
                    setOpen(true);
                }}
            >
                <Heading />
                <MiningButton />
                <LostConnectionAlert />
                <LowHashRateWarning />
            </SidebarTop>
            <Scroll>
                <Top>
                    <Miner />
                </Top>
                <Bottom>
                    <AirdropGiftTracker />
                    <Wallet />
                </Bottom>
            </Scroll>

            <StagedSecurityModal open={open} setOpen={setOpen} />
        </SideBarContainer>
    );
}

export default SideBar;
