import { useAirdropStore } from '@app/store/useAirdropStore';
import ConnectButton from './ConnectButton/ConnectButton';
import UserInfo from './UserInfo/UserInfo';
import { AirdropLoginPosition } from './styles';
import { appConfig } from '@app/config';

export default function AirdropLogin() {
    const { airdropTokens } = useAirdropStore();

    if (!appConfig.displayAirdropWipUI) return null;

    const isLoggedIn = !!airdropTokens;

    return <AirdropLoginPosition>{!isLoggedIn ? <ConnectButton /> : <UserInfo />}</AirdropLoginPosition>;
}
