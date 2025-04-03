import AirdropGiftTracker from '../Airdrop/AirdropGiftTracker/AirdropGiftTracker.tsx';
import Wallet from './components/Wallet/Wallet.tsx';
import Heading from './components/Heading';
import LostConnectionAlert from './components/LostConnectionAlert';
import MiningButton from './components/MiningButton/MiningButton';
import Miner from './Miner/Miner';
import { Bottom, Scroll, SideBarContainer, SidebarTop, Top } from './styles';

export default function SideBar() {
    return (
        <SideBarContainer>
            <SidebarTop>
                <Heading />
                <MiningButton />
                <LostConnectionAlert />
                {/* <OrphanChainAlert /> */}
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
