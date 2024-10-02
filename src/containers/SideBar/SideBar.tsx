import Miner from './Miner/Miner';
import Wallet from './components/Wallet';
import Heading from './components/Heading';
import { Bottom, Scroll, SideBarContainer, Top } from './styles';

import MiningButton from '@app/containers/Dashboard/MiningView/components/MiningButton.tsx';
import AirdropGiftTracker from '@app/containers/Airdrop/AirdropGiftTracker/AirdropGiftTracker';
import { Divider } from '@app/components/elements/Divider.tsx';
import LostConnectionAlert from './components/LostConnectionAlert';

function SideBar() {
    return (
        <SideBarContainer>
            <Top style={{ padding: '0 16px 12px', gap: '20px' }}>
                <Heading />
                <MiningButton />
                <LostConnectionAlert />
            </Top>
            <Divider />
            <Scroll style={{ padding: '12px 16px 16px' }}>
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
