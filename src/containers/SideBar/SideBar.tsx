import Miner from './Miner/Miner';
import Wallet from './components/Wallet';
import Heading from './components/Heading';
import {
  SideBarContainer,
  SideBarInner,
  HeadingContainer,
  BottomContainer,
} from './styles';
import TestButtons from './TestButtons';
import { useTheme } from '@mui/material/styles';
import useAppStateStore from '../../store/appStateStore';

function SideBar() {
  const theme = useTheme();
  const sidebarOpen = useAppStateStore((state) => state.sidebarOpen);
  return (
    <SideBarContainer theme={theme} sidebaropen={sidebarOpen}>
      <HeadingContainer>
        <Heading />
      </HeadingContainer>
      <SideBarInner>
        <Miner />
        <TestButtons />
      </SideBarInner>
      <BottomContainer>
        <Wallet />
      </BottomContainer>
    </SideBarContainer>
  );
}

export default SideBar;
