import { useAirdropStore } from '@app/store/useAirdropStore';
import ConnectButton from './ConnectButton/ConnectButton';
import UserInfo from './UserInfo/UserInfo';
import { AirdropLoginPosition } from './styles';

export default function AirdropLogin() {
    const { airdropTokens } = useAirdropStore();

    const isLoggedIn = !!airdropTokens;

    return <AirdropLoginPosition>{!isLoggedIn ? <ConnectButton /> : <UserInfo />}</AirdropLoginPosition>;
}
