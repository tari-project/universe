import universeAnimation from './splashscreen.json';
import { useLottie } from 'lottie-react';
import { SplashScreenContainer, LottieContainer, SplashScreenWrapper } from './SplashScreen.styles';
import { AnimatePresence } from 'framer-motion';
import { useUIStore } from '@app/store/useUIStore';

const SplashScreen = () => {
    const showSplash = useUIStore((s) => s.showSplash);
    const setShowSplash = useUIStore((s) => s.setShowSplash);
    const options = {
        animationData: universeAnimation,
        loop: false,
    };

    const { View } = useLottie(options);

    return (
        <AnimatePresence>
            {showSplash && (
                <SplashScreenWrapper
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { delay: 3.5, duration: 0.5 } }}
                    onAnimationComplete={() => {
                        setShowSplash(false);
                    }}
                >
                    <SplashScreenContainer>
                        <LottieContainer>{View}</LottieContainer>
                    </SplashScreenContainer>
                </SplashScreenWrapper>
            )}
        </AnimatePresence>
    );
};

export default SplashScreen;
