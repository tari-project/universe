import React from 'react';
import universeAnimation from './splashscreen.json';
import { useLottie } from 'lottie-react';
import { SplashScreenContainer, LottieContainer } from './SplashScreen.styles';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@app/store/useUIStore';

const SplashScreen: React.FC = () => {
    const showSplash = useUIStore((s) => s.showSplash);
    const options = {
        animationData: universeAnimation,
        loop: false,
    };

    const { View } = useLottie(options);

    return (
        <AnimatePresence>
            {showSplash && (
                <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.5 } }}
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        zIndex: 1000,
                    }}
                >
                    <SplashScreenContainer>
                        <LottieContainer>{View}</LottieContainer>
                    </SplashScreenContainer>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SplashScreen;
