import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import SetupProgress from './SetupProgress';

import { Container, LottieWrapper, StatusWrapper } from './Footer.styles';
import animationData from './lil-soon-cookies.json';
import AirdropPermission from './AirdropPermission/AirdropPermission';

export default function Footer() {
    return (
        <Container>
            <StatusWrapper>
                <LottieWrapper>
                    <DotLottieReact data={animationData} autoplay loop />
                </LottieWrapper>
                <SetupProgress />
            </StatusWrapper>
            <AirdropPermission />
        </Container>
    );
}
