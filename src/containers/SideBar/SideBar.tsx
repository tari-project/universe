import Miner from './Miner/Miner';
import Wallet from './components/Wallet';
import Heading from './components/Heading';
import { SideBarContainer, SideBarInner, BottomContainer, TopContainer } from './styles';

import MiningButton from '@app/containers/Dashboard/MiningView/components/MiningButton.tsx';
import { Divider } from '@app/components/elements/Divider.tsx';
import { LayoutGroup } from 'framer-motion';

function SideBar() {
    return (
        <SideBarContainer layout style={{ height: '100%' }} transition={{ duration: 200 }} layoutId="sidebar">
            <LayoutGroup id="sidebar-content">
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
            </LayoutGroup>
        </SideBarContainer>
    );
}

export default SideBar;
