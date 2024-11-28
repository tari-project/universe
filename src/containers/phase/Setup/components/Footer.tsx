import Lottie from 'react-lottie';
import SetupProgress from './SetupProgress';

import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { Container, LottieWrapper, StatusWrapper } from './Footer.styles';
import animationData from './lil-soon-cookies.json';
import AirdropPermission from './AirdropPermission/AirdropPermission';

export default function Footer() {
    const created_at = useAppConfigStore((s) => s.created_at);
    const now = new Date();
    const config_creation_date = created_at ? new Date(created_at) : null;

    const diff = config_creation_date ? now.getTime() - config_creation_date.getTime() : 0;
    const isFirstLoad = diff > 0 && diff < 1000 * 60; // 1 min buffer
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
            {isFirstLoad ? <AirdropPermission /> : null}
        </Container>
    );
}
