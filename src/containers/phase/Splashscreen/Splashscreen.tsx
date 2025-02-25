import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { LottieWrapper, SplashScreenContainer } from './SplashScreenContainer.styles';

import default_url from './Tari_Universe_Black_JSON.json?url';
import dm_url from './Tari_Universe_White_JSON.json?url';
import { useTheme } from 'styled-components';

export default function Splashscreen() {
    const theme = useTheme();
    const url = theme.mode === 'dark' ? dm_url : default_url;
    return (
        <SplashScreenContainer>
            <LottieWrapper>
                <DotLottieReact src={url} autoplay />
            </LottieWrapper>
        </SplashScreenContainer>
    );
}
