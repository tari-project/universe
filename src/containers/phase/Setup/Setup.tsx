import Footer from '@app/containers/phase/Setup/components/Footer';
import HeroText from './components/HeroText';
import InfoNav from './components/InfoNav/InfoNav';
import { SetupWrapper } from '@app/containers/phase/Setup/Setup.styles';
import grain from '/assets/img/grain.png';
import { memo, Suspense } from 'react';

const Setup = memo(function Setup() {
    return (
        <SetupWrapper $bg={grain}>
            <HeroText />
            <Suspense fallback={null}>
                <InfoNav />
            </Suspense>
            <Footer />
        </SetupWrapper>
    );
});

export default Setup;
