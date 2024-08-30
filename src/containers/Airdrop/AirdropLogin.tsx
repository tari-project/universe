import { useAirdropStore } from '@app/store/useAirdropStore';
import ConnectButton from './components/ConnectButton/ConnectButton';
import UserInfo from './components/UserInfo/UserInfo';
import { AirdropLoginPosition } from './styles';

export default function AirdropLogin() {
    const { airdropTokens } = useAirdropStore();

    const isLoggedIn = !!airdropTokens;

    return <AirdropLoginPosition>{!isLoggedIn ? <ConnectButton /> : <UserInfo />}</AirdropLoginPosition>;
}
