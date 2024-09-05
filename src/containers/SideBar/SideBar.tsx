import Miner from './Miner/Miner';
import Wallet from './components/Wallet';
import Heading from './components/Heading';
import { SideBarContainer, SideBarInner, BottomContainer, TopContainer } from './styles';

import { useUIStore } from '../../store/useUIStore.ts';
import MiningButton from '@app/containers/Dashboard/MiningView/components/MiningButton.tsx';
import { Divider } from '@app/components/elements/Divider.tsx';

function SideBar() {
    const sidebarOpen = useUIStore((state) => state.sidebarOpen);
    return (
        <SideBarContainer $sidebarOpen={sidebarOpen}>
            <TopContainer>
                <Heading />
                <MiningButton />
            </TopContainer>
            <Divider />
            <SideBarInner>
                <Miner />
            </SideBarInner>
            <BottomContainer>
                <Wallet />
            </BottomContainer>
        </SideBarContainer>
    );
}

export default SideBar;
