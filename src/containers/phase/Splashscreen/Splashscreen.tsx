import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { LottieWrapper, SplashScreenContainer } from './SplashScreenContainer.styles';

import url from './Tari_Universe_Black_JSON.json?url';

export default function Splashscreen() {
    return (
        <SplashScreenContainer>
            <LottieWrapper>
                <DotLottieReact src={url} autoplay />
            </LottieWrapper>
        </SplashScreenContainer>
    );
}
