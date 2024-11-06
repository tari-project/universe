import Lottie from 'react-lottie';
import Permissions from '@app/containers/phase/Setup/components/Permissions';
import SetupProgress from './SetupProgress';

import { Container, LottieWrapper, StatusWrapper } from './Footer.styles';
import animationData from './lil-soon-cookies.json';

export default function Footer() {
    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };
    return (
        <Container>
            <StatusWrapper>
                <LottieWrapper>
                    <Lottie options={defaultOptions} height={100} width={100} />
                </LottieWrapper>
                <SetupProgress />
            </StatusWrapper>
            <Permissions />
        </Container>
    );
}
