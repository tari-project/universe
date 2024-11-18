import { useSetUp } from '@app/hooks';
import Footer from '@app/containers/phase/Setup/components/Footer';
import HeroText from './components/HeroText';
import InfoNav from './components/InfoNav/InfoNav';
import { AppContentContainer } from '@app/App/App.styles';
import grain from '/assets/img/grain.png';
import { SetupWrapper } from './Setup.styles';

export default function Setup() {
    useSetUp();
    return (
        <AppContentContainer key="setup" initial="visible">
            <SetupWrapper $bg={grain}>
                <HeroText />
                <InfoNav />
                <Footer />
            </SetupWrapper>
        </AppContentContainer>
    );
}
