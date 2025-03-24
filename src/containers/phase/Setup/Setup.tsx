import Footer from '@app/containers/phase/Setup/components/Footer';
import { useSetUp } from '@app/hooks';
import HeroText from './components/HeroText';
import InfoNav from './components/InfoNav/InfoNav';
import { SetupWrapper } from '@app/containers/phase/Setup/Setup.styles';
import grain from '/assets/img/grain.png';
import { memo } from 'react';

const Setup = memo(function Setup() {
    return (
        <SetupWrapper $bg={grain}>
            <HeroText />
            <InfoNav />
            <Footer />
        </SetupWrapper>
    );
});

export default Setup;
