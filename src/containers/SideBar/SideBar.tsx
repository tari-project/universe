import Miner from './Miner/Miner';
import Wallet from './components/Wallet';
import Heading from './components/Heading';
import { SideBarContainer, SideBarInner, BottomContainer } from './styles';

import { useUIStore } from '../../store/useUIStore.ts';
import MiningButton from '@app/containers/Dashboard/MiningView/components/MiningButton.tsx';
import { Dialog } from '@app/components/elements/dialog/Dialog.tsx';

function SideBar() {
    const sidebarOpen = useUIStore((state) => state.sidebarOpen);
    return (
        <SideBarContainer $sidebarOpen={sidebarOpen}>
            <Heading />
            <MiningButton />
            <SideBarInner>
                <Miner />
                <Dialog heading="wtf bra">
                    HELLO
                    <br />
                    wtf? <br />
                    bruhhh
                </Dialog>
            </SideBarInner>
            <BottomContainer>
                <Wallet />
            </BottomContainer>
        </SideBarContainer>
    );
}

export default SideBar;
