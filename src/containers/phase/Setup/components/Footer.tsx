import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import SetupProgress from './SetupProgress';

import { Container, LottieWrapper, StatusWrapper } from './Footer.styles';
import animationData from './lil-soon-cookies.json';
import AirdropPermission from './AirdropPermission/AirdropPermission';
import AppVersion from './AppVersion/AppVersion';
import { useAirdropStore } from '@app/store/useAirdropStore';
import AirdropShare from './AirdropShare/AirdropShare';
import AirdropLogin from './AirdropLogin/AirdropLogin';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { AnimatePresence } from 'framer-motion';

export default function Footer() {
    const { airdropTokens } = useAirdropStore();
    const isLoggedIn = !!airdropTokens;
    const allowTelemetry = useAppConfigStore((s) => s.allow_telemetry);

    /*
    // @peps: Im disabling this for now, 
    // the airdrop share markup requires the AirdropPermission component to be shown

    const created_at = useAppConfigStore((s) => s.created_at);
    const now = new Date();
    const config_creation_date = created_at ? new Date(created_at) : null;

    const diff = config_creation_date ? now.getTime() - config_creation_date.getTime() : 0;
    const isFirstLoad = diff > 0 && diff < 1000 * 60; // 1 min buffer

    const showAirdropPermission = !allowTelemetry || isFirstLoad;
    */

    const airdropShareMarkup = isLoggedIn ? <AirdropShare /> : <AirdropLogin />;

    return (
        <Container>
            <StatusWrapper>
                <LottieWrapper>
                    <DotLottieReact data={animationData} autoplay loop />
                </LottieWrapper>
                <SetupProgress />
            </StatusWrapper>

            <AppVersion />

            <AnimatePresence>{allowTelemetry ? airdropShareMarkup : null}</AnimatePresence>

            <AirdropPermission />
        </Container>
    );
}
