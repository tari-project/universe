import { useAirdropStore } from '@app/store/useAirdropStore';
import ConnectButton from './ConnectButton/ConnectButton';
import UserInfo from './UserInfo/UserInfo';
import { AirdropLoginPosition } from './styles';
import { useAirdropSyncState } from '@app/hooks/airdrop/useAirdropSyncState';

export default function AirdropLogin() {
    useAirdropSyncState();
    const { airdropTokens, wipUI } = useAirdropStore();

    if (!wipUI) return null;

    const isLoggedIn = !!airdropTokens;

    return <AirdropLoginPosition>{!isLoggedIn ? <ConnectButton /> : <UserInfo />}</AirdropLoginPosition>;
}
