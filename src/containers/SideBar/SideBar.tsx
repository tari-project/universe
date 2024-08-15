import Miner from './Miner/Miner';
import Wallet from './components/Wallet';
import Heading from './components/Heading';
import Milestones from './components/Milestone';
import {
    SideBarContainer,
    SideBarInner,
    HeadingContainer,
    BottomContainer,
} from './styles';
import TestButtons from './TestButtons';
import { useTheme } from '@mui/material/styles';

import { useUIStore } from '../../store/useUIStore.ts';
import ConnectButton from '../Airdrop/components/ConnectButton.tsx';
// import TestButtons from './TestButtons.tsx';

function SideBar() {
    const theme = useTheme();
    const sidebarOpen = useUIStore((state) => state.sidebarOpen);
    return (
        <SideBarContainer theme={theme} sidebaropen={sidebarOpen}>
            <HeadingContainer>
                <Heading />
            </HeadingContainer>
            <SideBarInner>
                <ConnectButton />
                <Miner />
                <Milestones />
                {/*<TestButtons />*/}
            </SideBarInner>
            <BottomContainer>
                <Wallet />
            </BottomContainer>
        </SideBarContainer>
    );
}

export default SideBar;
