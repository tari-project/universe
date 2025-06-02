import { useEffect } from 'react';
import { Wrapper } from './styles';
import { AnimatePresence } from 'motion/react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import coins_progress_url from '../lotties/Coins_Progress_Lottie.json?url';

interface Props {
    onComplete?: () => void;
    isVisible: boolean;
    setIsVisible: (isVisible: boolean) => void;
}

export const ProgressAnimation = ({ onComplete, isVisible, setIsVisible }: Props) => {
    useEffect(() => {
        if (!isVisible) return;

        const timer = setTimeout(() => {
            setIsVisible(false);
            onComplete?.();
        }, 4000);

        return () => clearTimeout(timer);
    }, [onComplete, setIsVisible, isVisible]);

    return (
        <AnimatePresence>
            {isVisible && (
                <Wrapper
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                        duration: 1,
                        ease: [0.15, 0, 0, 0.97],
                    }}
                >
                    <DotLottieReact src={coins_progress_url} autoplay loop={false} className="lottie-animation" />
                </Wrapper>
            )}
        </AnimatePresence>
    );
};
