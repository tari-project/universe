import Miner from './Miner/Miner';
import Wallet from './components/Wallet/Wallet.tsx';
import Heading from './components/Heading';
import { Bottom, Scroll, SideBarContainer, SidebarTop, Top } from './styles';

import MiningButton from '@app/containers/Dashboard/MiningView/components/MiningButton.tsx';
import AirdropGiftTracker from '@app/containers/Airdrop/AirdropGiftTracker/AirdropGiftTracker';
import LostConnectionAlert from './components/LostConnectionAlert';
import OrphanChainAlert from './components/OrphanChainAlert.tsx';

function SideBar() {
    return (
        <SideBarContainer>
            <SidebarTop>
                <Heading />
                <MiningButton />
                <LostConnectionAlert />
                <OrphanChainAlert />
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
        </SideBarContainer>
    );
}

export default SideBar;
