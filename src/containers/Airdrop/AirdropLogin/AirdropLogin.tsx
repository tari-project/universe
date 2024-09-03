import { useAirdropStore } from '@app/store/useAirdropStore';
import ConnectButton from './ConnectButton/ConnectButton';
import UserInfo from './UserInfo/UserInfo';
import { AirdropLoginPosition } from './styles';
import AirdropLoginAlert from '../AirdropLoginAlert/AirdropLoginAlert';
import { AnimatePresence } from 'framer-motion';

export default function AirdropLogin() {
    const { airdropTokens, showLoginAlert } = useAirdropStore();

    const isLoggedIn = !!airdropTokens;

    return (
        <AirdropLoginPosition>
            {!isLoggedIn ? <ConnectButton /> : <UserInfo />}
            {!isLoggedIn && <AnimatePresence>{showLoginAlert && <AirdropLoginAlert />}</AnimatePresence>}
        </AirdropLoginPosition>
    );
}
