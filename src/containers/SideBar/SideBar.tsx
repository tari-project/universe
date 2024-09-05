import Miner from './Miner/Miner';
import Wallet from './components/Wallet';
import Heading from './components/Heading';
import { SideBarContainer, SideBarInner, BottomContainer } from './styles';

import { useUIStore } from '../../store/useUIStore.ts';
import MiningButton from '@app/containers/Dashboard/MiningView/components/MiningButton.tsx';
import { UpdatedStatus } from './components/UpdatedStatus.tsx';
import { useUpdateStatus } from '@app/hooks/useUpdateStatus.ts';

function SideBar() {
    const sidebarOpen = useUIStore((state) => state.sidebarOpen);
    const { status, contentLength, downloaded } = useUpdateStatus();

    return (
        <SideBarContainer $sidebarOpen={sidebarOpen}>
            <Heading />
            {status !== 'NONE' && (
                <UpdatedStatus contentLength={contentLength} status={status} downloaded={downloaded} />
            )}
            <MiningButton />
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
