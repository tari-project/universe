import Miner from './Miner/Miner';
import Wallet from './components/Wallet';
import Heading from './components/Heading';
import Milestones from './components/Milestone';
import MinerUptimeChart from './components/MinerUptimeChart.tsx';
import HashRateChart from './components/HashRateChart.tsx';
import {
    SideBarContainer,
    SideBarInner,
    HeadingContainer,
    BottomContainer,
} from './styles';
import { useTheme } from '@mui/material/styles';
import { useUIStore } from '../../store/useUIStore.ts';
import { Divider } from '@mui/material';

function SideBar() {
    const theme = useTheme();
    const sidebarOpen = useUIStore((state) => state.sidebarOpen);
    return (
        <SideBarContainer theme={theme} sidebaropen={sidebarOpen}>
            <HeadingContainer>
                <Heading />
            </HeadingContainer>
            <SideBarInner>
                <Miner />
                <MinerUptimeChart />
                <Divider />
                <HashRateChart />
            </SideBarInner>
            <BottomContainer>
                <Milestones />
                <Wallet />
            </BottomContainer>
        </SideBarContainer>
    );
}

export default SideBar;
