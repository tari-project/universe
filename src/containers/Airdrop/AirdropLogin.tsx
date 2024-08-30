import ConnectButton from './components/ConnectButton/ConnectButton';
import UserInfo from './components/UserInfo/UserInfo';
import { AirdropLoginPosition } from './styles';

export default function AirdropLogin() {
    const isLoggedIn = false;

    return <AirdropLoginPosition>{!isLoggedIn ? <ConnectButton /> : <UserInfo />}</AirdropLoginPosition>;
}
