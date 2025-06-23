import { useState } from 'react';
import { ButtonWrapper } from './styles.ts';
import StartButton from './StartButton/StartButton.tsx';
import StopButton from './StopButton/StopButton.tsx';
import { AnimatePresence } from 'motion/react';
import LoadingButton from './LoadingButton/LoadingButton.tsx';

export default function MiningButtonCombined() {
    const [isMining, setIsMining] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleStartMining = () => {
        setIsMining(true);
    };

    const handleStopMining = () => {
        setIsMining(false);
    };

    return (
        <ButtonWrapper>
            <AnimatePresence mode="popLayout">
                {isLoading ? (
                    <LoadingButton />
                ) : !isMining ? (
                    <StartButton onClick={handleStartMining} />
                ) : (
                    <StopButton onClick={handleStopMining} />
                )}
            </AnimatePresence>
        </ButtonWrapper>
    );
}
