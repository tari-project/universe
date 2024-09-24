import Miner from './Miner/Miner';
import Wallet from './components/Wallet';
import Heading from './components/Heading';
import { SideBarContainer, SideBarInner, BottomContainer, TopContainer } from './styles';

import MiningButton from '@app/containers/Dashboard/MiningView/components/MiningButton.tsx';
import AirdropGiftTracker from '@app/containers/Airdrop/AirdropGiftTracker/AirdropGiftTracker';
import { Divider } from '@app/components/elements/Divider.tsx';
import LostConnectionAlert from './components/LostConnectionAlert';

function SideBar() {
    return (
        <SideBarContainer style={{ height: '100%' }} transition={{ duration: 200 }} layoutId="sidebar">
            <TopContainer>
                <Heading />
                <MiningButton />
                <LostConnectionAlert />
            </TopContainer>
            <Divider />
            <SideBarInner>
                <Miner />
            </SideBarInner>
            <BottomContainer>
                <AirdropGiftTracker />
                <Wallet />
            </BottomContainer>
        </SideBarContainer>
    );
}

export default SideBar;
