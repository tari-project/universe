import Footer from '@app/containers/phase/Setup/components/Footer';
import { useSetUp } from '@app/hooks';
import HeroText from './components/HeroText';
import InfoNav from './components/InfoNav/InfoNav';
import { SetupWrapper } from '@app/containers/phase/Setup/Setup.styles';
import grain from '/assets/img/grain.png';
import AirdropLogin from './components/AirdropLogin/AirdropLogin';
import { useAirdropStore } from '@app/store/useAirdropStore';
import AirdropShare from './components/AirdropShare/AirdropShare';

export default function Setup() {
    useSetUp();

    const { airdropTokens } = useAirdropStore();
    const isLoggedIn = !!airdropTokens;

    return (
        <SetupWrapper $bg={grain}>
            {isLoggedIn ? <AirdropShare /> : <AirdropLogin />}
            <HeroText />
            <InfoNav />
            <Footer />
        </SetupWrapper>
    );
}
