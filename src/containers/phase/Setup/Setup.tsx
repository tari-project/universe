import Footer from '@app/containers/phase/Setup/components/Footer';
import { useSetUp } from '@app/hooks';
import HeroText from './components/HeroText';
import InfoNav from './components/InfoNav/InfoNav';
import { SetupWrapper } from '@app/containers/phase/Setup/Setup.styles';
import grain from '/assets/img/grain.png';
import AppVersion from './components/AppVersion';

export default function Setup() {
    useSetUp();
    return (
        <SetupWrapper $bg={grain}>
            <HeroText />
            <InfoNav />
            <Footer />
            <AppVersion />
        </SetupWrapper>
    );
}
