import { memo, useMemo } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import SetupProgress from './SetupProgress';

import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { Container, LottieWrapper, StatusWrapper } from './Footer.styles';
import animationData from './lil-soon-cookies.json';
import AirdropPermission from './AirdropPermission/AirdropPermission';
import AppVersion from './AppVersion/AppVersion';

const Footer = memo(function Footer() {
    const created_at = useAppConfigStore((s) => s.created_at);

    const isFirstLoad = useMemo(() => {
        const now = new Date();
        const config_creation_date = created_at ? new Date(created_at) : null;

        const diff = config_creation_date ? now.getTime() - config_creation_date.getTime() : 0;
        return diff > 0 && diff < 1000 * 60; // 1 min buffer
    }, [created_at]);

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
});
export default Footer;
