import { DotLottieReact, DotLottieWorkerReact } from '@lottiefiles/dotlottie-react';
import { SplashScreenContainer } from './SplashScreenContainer.styles';

import lottieData from '../../../../public/assets/splashscreen.json';

export default function Splashscreen() {
    return (
        <SplashScreenContainer>
            <DotLottieReact
                src="../../../../public/assets/splashscreen.json"
                speed={1}
                style={{ width: '600px', height: '600px', background: 'transparent', display: 'flex' }}
                loop
                animationId="splashscreen"
                // mode="forward"
            ></DotLottieReact>
        </SplashScreenContainer>
    );
}
