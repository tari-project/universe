import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import SetupProgress from './SetupProgress';

import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { Container, LottieWrapper, StatusWrapper } from './Footer.styles';
import animationData from './lil-soon-cookies.json';
import AirdropPermission from './AirdropPermission/AirdropPermission';
import AppVersion from './AppVersion/AppVersion';

export default function Footer() {
    const created_at = useAppConfigStore((s) => s.created_at);
    const now = new Date();
    const config_creation_date = created_at ? new Date(created_at) : null;

    const diff = config_creation_date ? now.getTime() - config_creation_date.getTime() : 0;
    const isFirstLoad = diff > 0 && diff < 1000 * 60; // 1 min buffer

    return (
        <Container>
            <StatusWrapper>
                <LottieWrapper>
                    <DotLottieReact data={animationData} autoplay loop />
                </LottieWrapper>
                <SetupProgress />
            </StatusWrapper>
            {isFirstLoad ? <AirdropPermission /> : <AppVersion />}
        </Container>
    );
}
