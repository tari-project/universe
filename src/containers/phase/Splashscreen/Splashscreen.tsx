import { useTheme } from 'styled-components';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { LottieWrapper, SplashScreenContainer } from './SplashScreenContainer.styles';

import default_url from './Tari_Universe_Black_JSON.json?url';
import dm_url from './Tari_Universe_White_JSON.json?url';
import { handleCloseSplashscreen } from '@app/store/actions/uiStoreActions.ts';

export default function Splashscreen() {
    const theme = useTheme();
    const url = theme.mode === 'dark' ? dm_url : default_url;
    return (
        <SplashScreenContainer>
            <LottieWrapper>
                <DotLottieReact
                    src={url}
                    autoplay
                    dotLottieRefCallback={(ref) =>
                        ref?.addEventListener('complete', () => {
                            handleCloseSplashscreen();
                        })
                    }
                />
            </LottieWrapper>
        </SplashScreenContainer>
    );
}
